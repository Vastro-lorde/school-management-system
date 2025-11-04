import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import Department from '../../../../src/server/db/models/Department.js';
import StaffProfile from '../../../../src/server/db/models/StaffProfile.js';
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
  const allowed = await permissionService.hasAccessToUrl(role, '/admin/faculty');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

  try {
    const [departments, staff] = await Promise.all([
      Department.find({}, { name: 1, code: 1 }).sort({ name: 1 }).lean(),
      StaffProfile.find({}, { firstName: 1, lastName: 1, employeeId: 1 }).sort({ firstName: 1, lastName: 1 }).lean(),
    ]);

    return res.json({
      success: true,
      value: {
        departments: departments.map(d => ({
          _id: d._id.toString(),
          name: d.name,
          code: d.code || '',
        })),
        staff: staff.map(s => ({
          _id: s._id.toString(),
          name: [s.firstName, s.lastName].filter(Boolean).join(' ') || s.employeeId || 'Staff',
          employeeId: s.employeeId || '',
        })),
      },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
