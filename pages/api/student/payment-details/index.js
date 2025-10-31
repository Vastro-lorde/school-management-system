import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import PaymentDetail from '../../../../src/server/db/models/PaymentDetail.js';
import Payment from '../../../../src/server/db/models/Payment.js';
import User from '../../../../src/server/db/models/User.js';
import permissionService from '../../../../src/server/services/permissionService.js';
import { authOptions } from '../../auth/[...nextauth].js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/student/payments');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

  try {
    const userId = session.user?.id;
    const user = await User.findById(userId).select('profileRef profileModel').lean();
    const studentId = user?.profileRef; // StudentProfile _id
    if (!studentId) return res.status(400).json({ success: false, message: 'Student profile not found' });

    if (req.method === 'GET') {
      const items = await PaymentDetail.find({ student: studentId })
        .populate({ path: 'payment', select: 'title' })
        .sort({ createdAt: -1 })
        .lean();
      return res.status(200).json({ success: true, value: items });
    }
    if (req.method === 'POST') {
      // Simulate making a new payment record; status starts pending unless meets required total
      const { payment, amount, installments, method, reference, notes, date } = req.body || {};
      if (!payment) return res.status(400).json({ success: false, message: 'payment required' });
      const normalizedInstallments = Array.isArray(installments)
        ? installments.filter(i => i && typeof i.amount === 'number').map(i => ({ amount: Number(i.amount) || 0, method: i.method || 'cash', reference: i.reference, date: i.date ? new Date(i.date) : undefined }))
        : [];

      // Determine status based on amount vs required
      const paymentDoc = await Payment.findById(payment).select('items').lean();
      const requiredTotal = (paymentDoc?.items || []).reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
      const amountToCheck = normalizedInstallments.length > 0 ? normalizedInstallments.reduce((s,a)=>s+(Number(a.amount)||0),0) : (Number(amount) || 0);
      const status = amountToCheck >= requiredTotal ? 'completed' : 'pending';

      const created = await PaymentDetail.create({
        student: studentId,
        payment,
        amount: Number(amount) || 0,
        installments: normalizedInstallments,
        method,
        reference,
        status,
        notes,
        date: date ? new Date(date) : undefined,
        createdBy: session.user?.id,
      });
      return res.status(201).json({ success: true, value: created });
    }
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
