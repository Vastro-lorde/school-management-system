import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import Payment from '../../../../src/server/db/models/Payment.js';
import StudentProfile from '../../../../src/server/db/models/StudentProfile.js';
import permissionService from '../../../../src/server/services/permissionService.js';
import { authOptions } from '../../auth/[...nextauth].js';

function mapPayment(payment) {
  const total = (payment.items || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  return {
    _id: payment._id,
    title: payment.title,
    description: payment.description,
    type: payment.type?.name || payment.type || null,
    total,
    effectiveDate: payment.effectiveDate,
    dueDate: payment.dueDate,
    active: payment.active,
  };
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/student/payments');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

  try {
    if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });

    const userId = session.user?.id;
    const student = await StudentProfile.findOne({ userId }).select('classId').lean();
    if (!student) return res.status(400).json({ success: false, message: 'Student profile not found' });

    const query = { active: true };
    if (student.classId) query.classes = student.classId;

    const payments = await Payment.find(query)
      .populate('type', 'name')
      .select('title description type items effectiveDate dueDate active')
      .sort({ createdAt: -1 })
      .lean();

    const today = new Date();
    const filtered = payments.filter(payment => {
      if (payment.effectiveDate && payment.effectiveDate > today) return false;
      if (payment.dueDate && payment.dueDate < today) return false;
      return true;
    });

    return res.status(200).json({
      success: true,
      value: { payments: filtered.map(mapPayment) },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
