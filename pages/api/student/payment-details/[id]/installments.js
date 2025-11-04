import { getServerSession } from 'next-auth';
import dbConnect from '../../../../../src/server/db/config.mjs';
import Payment from '../../../../../src/server/db/models/Payment.js';
import PaymentDetail from '../../../../../src/server/db/models/PaymentDetail.js';
import User from '../../../../../src/server/db/models/User.js';
import permissionService from '../../../../../src/server/services/permissionService.js';
import { authOptions } from '../../../auth/[...nextauth].js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/student/payments');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

  try {
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

    const { id } = req.query;
    if (!id) return res.status(400).json({ success: false, message: 'payment detail id required' });

    const user = await User.findById(session.user?.id).select('profileRef').lean();
    const studentId = user?.profileRef;
    if (!studentId) return res.status(400).json({ success: false, message: 'Student profile not found' });

    const detail = await PaymentDetail.findOne({ _id: id, student: studentId });
    if (!detail) return res.status(404).json({ success: false, message: 'Payment record not found' });
    if (detail.status === 'failed' || detail.status === 'refunded') {
      return res.status(400).json({ success: false, message: 'Cannot add installments to this payment record' });
    }

    const { amount, date, method, reference } = req.body || {};
    const numericAmount = Number(amount);
    if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount required' });
    }

    const installment = {
      amount: numericAmount,
      method: method || 'cash',
    };
    if (reference) installment.reference = reference;
    if (date) installment.date = new Date(date);

    const installments = Array.isArray(detail.installments) ? [...detail.installments, installment] : [installment];
    detail.installments = installments;
    detail.amount = installments.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
    if (installment.date) detail.date = installment.date;

    const payment = await Payment.findById(detail.payment).select('items').lean();
    const requiredTotal = (payment?.items || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    detail.status = detail.amount >= requiredTotal ? 'completed' : 'pending';

    await detail.save();
    await detail.populate({ path: 'payment', select: 'title' });

    return res.status(200).json({ success: true, value: detail });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
