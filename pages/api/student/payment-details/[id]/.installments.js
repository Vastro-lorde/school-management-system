import { getServerSession } from 'next-auth';
import dbConnect from '../../../../../src/server/db/config.mjs';
import PaymentDetail from '../../../../../src/server/db/models/PaymentDetail.js';
import Payment from '../../../../../src/server/db/models/Payment.js';
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

  const { id } = req.query;
  try {
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });
    const userId = session.user?.id;
    const user = await User.findById(userId).select('profileRef profileModel').lean();
    const studentId = user?.profileRef;
    if (!studentId) return res.status(400).json({ success: false, message: 'Student profile not found' });

    const detail = await PaymentDetail.findById(id);
    if (!detail) return res.status(404).json({ success: false, message: 'Not found' });
    if (String(detail.student) !== String(studentId)) return res.status(403).json({ success: false, message: 'Forbidden' });

    const { amount, method, reference, date } = req.body || {};
    const installment = { amount: Number(amount) || 0, method: method || 'cash', reference, date: date ? new Date(date) : new Date() };
    detail.installments = detail.installments || [];
    detail.installments.push(installment);
    // Model pre-validate hook will recompute amount
    // After push, check if total meets required to set status
    const paymentDoc = await Payment.findById(detail.payment).select('items').lean();
    const requiredTotal = (paymentDoc?.items || []).reduce((s, it) => s + (Number(it.amount) || 0), 0);
    const total = detail.installments.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    if (total >= requiredTotal) detail.status = 'completed';
    await detail.save();
    return res.status(200).json({ success: true, value: detail });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
