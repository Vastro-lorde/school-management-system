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

  const { id } = req.query;
  try {
    if (req.method === 'GET') {
      const item = await PaymentDetail.findById(id)
        .populate({ path: 'student', select: 'firstName lastName admissionNo' })
        .populate({ path: 'payment', select: 'title' })
        .populate({ path: 'createdBy', select: 'email role' })
        .lean();
      if (!item) return res.status(404).json({ success: false, message: 'Not found' });
      return res.status(200).json({ success: true, value: item });
    }
    if (req.method === 'PUT') {
      const { amount, installments, method, reference, status, notes, date } = req.body || {};
      const existing = await PaymentDetail.findById(id).lean();
      if (!existing) return res.status(404).json({ success: false, message: 'Not found' });

      const update = { amount, method, reference, status, notes };
      if (date) update.date = new Date(date);
      let normalizedInstallments;
      if (Array.isArray(installments)) {
        normalizedInstallments = installments
          .filter(i => i && (typeof i.amount === 'number'))
          .map(i => ({ amount: Number(i.amount) || 0, method: i.method || 'cash', reference: i.reference, date: i.date ? new Date(i.date) : undefined }));
        update.installments = normalizedInstallments;
      }

      // Service-level validation for completed status
      const finalStatus = typeof status === 'string' ? status : existing.status;
      if (finalStatus === 'completed') {
        const paymentDoc = await Payment.findById(existing.payment).select('items').lean();
        const requiredTotal = (paymentDoc?.items || []).reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
        const amountToCheck = Array.isArray(normalizedInstallments)
          ? normalizedInstallments.reduce((s, i) => s + (Number(i.amount) || 0), 0)
          : (typeof amount === 'number' ? Number(amount) : Number(existing.amount)) || 0;
        if (amountToCheck < requiredTotal) {
          return res.status(400).json({ success: false, message: 'Amount paid is less than the required total for this payment.' });
        }
      }

      const updated = await PaymentDetail.findByIdAndUpdate(id, update, { new: true });
      return res.status(200).json({ success: true, value: updated });
    }
    if (req.method === 'DELETE') {
      await PaymentDetail.findByIdAndDelete(id);
      return res.status(200).json({ success: true });
    }
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
