import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import StudentProfile from '../../../../src/server/db/models/StudentProfile.js';
import DepartmentModel from '../../../../src/server/db/models/Department.js';
import permissionService from '../../../../src/server/services/permissionService.js';
import { authOptions } from '../../auth/[...nextauth].js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/admin/students');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

  try {
    if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });

    const total = await StudentProfile.countDocuments({});
    const byGender = await StudentProfile.aggregate([
      { $group: { _id: { $ifNull: ['$gender', 'unknown'] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const byDepartment = await StudentProfile.aggregate([
      { $group: { _id: { $ifNull: ['$departmentId', 'Unassigned'] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    // map department ids to names
    const deptIds = byDepartment.filter(x => x._id && x._id !== 'Unassigned').map(x => x._id);
    const departments = await DepartmentModel.find({ _id: { $in: deptIds } }).select('name').lean();
    const deptNameMap = new Map(departments.map(d => [String(d._id), d.name]));
    const byDepartmentNamed = byDepartment.map(row => ({ label: row._id === 'Unassigned' ? 'Unassigned' : deptNameMap.get(String(row._id)) || 'Unknown', count: row.count }));

    return res.status(200).json({ success: true, value: { total, byGender, byDepartment: byDepartmentNamed } });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
