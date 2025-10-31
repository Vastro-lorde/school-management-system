import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import Payment from '../../../../src/server/db/models/Payment.js';
import StudentProfile from '../../../../src/server/db/models/StudentProfile.js';
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
    if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });

    const [students, payments] = await Promise.all([
      StudentProfile.find({}, 'firstName lastName admissionNo').sort({ createdAt: -1 }).lean(),
      Payment.find({ active: true }, 'title').sort({ createdAt: -1 }).lean(),
    ]);

    const mappedStudents = students.map(s => ({
      id: s._id,
      name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.admissionNo,
      admissionNo: s.admissionNo,
    }));

  return res.status(200).json({ success: true, value: { students: mappedStudents, payments } });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
