import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import StaffProfile from '../../../../src/server/db/models/StaffProfile.js';
import permissionService from '../../../../src/server/services/permissionService.js';
import { authOptions } from '../../auth/[...nextauth].js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/admin/staffs');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

  try {
    if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });

    const total = await StaffProfile.countDocuments({});
    const byDepartment = await StaffProfile.aggregate([
      { $group: { _id: { $ifNull: ['$department', 'Unassigned'] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const byGender = await StaffProfile.aggregate([
      { $group: { _id: { $ifNull: ['$gender', 'unknown'] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return res.status(200).json({ success: true, value: { total, byDepartment, byGender } });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
