import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import PaymentDetail from '../../../../src/server/db/models/PaymentDetail.js';
import Payment from '../../../../src/server/db/models/Payment.js';
import permissionService from '../../../../src/server/services/permissionService.js';
import { authOptions } from '../../auth/[...nextauth].js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/admin/payment-details');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

  try {
    if (req.method === 'GET') {
      const { studentId, paymentId, q, limit = 50, page = 1 } = req.query || {};
      const filter = {};
      if (studentId) filter.student = studentId;
      if (paymentId) filter.payment = paymentId;

      let query = PaymentDetail.find(filter)
        .populate({ path: 'student', select: 'firstName lastName admissionNo' })
        .populate({ path: 'payment', select: 'title' })
        .populate({ path: 'createdBy', select: 'email role' })
        .sort({ createdAt: -1 });

      const lim = Math.min(Number(limit) || 50, 200);
      const pg = Math.max(Number(page) || 1, 1);
      query = query.limit(lim).skip(lim * (pg - 1));

      const items = await query.lean();
      return res.status(200).json({ success: true, value: items });
    }
    if (req.method === 'POST') {
      const { student, payment, amount, installments, method, reference, status, notes, date } = req.body || {};
      if (!student) return res.status(400).json({ success: false, message: 'student required' });
      if (!payment) return res.status(400).json({ success: false, message: 'payment required' });
      const normalizedInstallments = Array.isArray(installments)
        ? installments
            .filter(i => i && (typeof i.amount === 'number'))
            .map(i => ({ amount: Number(i.amount) || 0, method: i.method || 'cash', reference: i.reference, date: i.date ? new Date(i.date) : undefined }))
        : [];

      const payload = {
        student,
        payment,
        // If installments provided, amount is derived in pre-validate hook; else use provided amount and one-off details
        amount: Number(amount) || 0,
        installments: normalizedInstallments,
        method,
        reference,
        status,
        notes,
        date: date ? new Date(date) : undefined,
        createdBy: session.user?.id,
      };
      if (!Array.isArray(installments) || installments.length === 0) {
        if (typeof payload.amount !== 'number' || payload.amount < 0) return res.status(400).json({ success: false, message: 'valid amount required' });
      }

      // Service-level validation: if status resolves to 'completed', ensure amount >= required total
      const effectiveStatus = status || 'completed';
      if (effectiveStatus === 'completed') {
        const paymentDoc = await Payment.findById(payment).select('items').lean();
        const requiredTotal = (paymentDoc?.items || []).reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
        const amountToCheck = (Array.isArray(normalizedInstallments) && normalizedInstallments.length > 0)
          ? normalizedInstallments.reduce((s, i) => s + (Number(i.amount) || 0), 0)
          : Number(payload.amount) || 0;
        if (amountToCheck < requiredTotal) {
          return res.status(400).json({ success: false, message: 'Amount paid is less than the required total for this payment.' });
        }
      }

      const created = await PaymentDetail.create(payload);
      return res.status(201).json({ success: true, value: created });
    }
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
