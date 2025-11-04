import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import StaffProfile from '../../../../src/server/db/models/StaffProfile.js';
import Subject from '../../../../src/server/db/models/Subject.js';
import permissionService from '../../../../src/server/services/permissionService.js';
import { authOptions } from '../../auth/[...nextauth].js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/admin/classes');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

  try {
    const [staff, subjects] = await Promise.all([
      StaffProfile.find({}, { firstName: 1, lastName: 1, employeeId: 1 }).sort({ firstName: 1, lastName: 1 }).lean(),
      Subject.find({}, { name: 1, subjectCode: 1 }).sort({ name: 1 }).lean(),
    ]);

    return res.json({
      success: true,
      value: {
        staff: staff.map(s => ({
          _id: s._id.toString(),
          name: [s.firstName, s.lastName].filter(Boolean).join(' ') || s.employeeId || 'Staff',
          employeeId: s.employeeId || '',
        })),
        subjects: subjects.map(sub => ({
          _id: sub._id.toString(),
          name: sub.name,
          subjectCode: sub.subjectCode || '',
        })),
      },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
