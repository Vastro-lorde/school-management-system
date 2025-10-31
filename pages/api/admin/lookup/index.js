import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import StudentProfile from '../../../../src/server/db/models/StudentProfile.js';
import StaffProfile from '../../../../src/server/db/models/StaffProfile.js';
import permissionService from '../../../../src/server/services/permissionService.js';
import { authOptions } from '../../auth/[...nextauth].js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/admin/user-lookup');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

  try {
    if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });
    const { type, q } = req.query || {};
    const term = String(q || '').trim();
    if (!term) return res.status(200).json({ success: true, value: [] });

    const limit = 20;
    if (type === 'staff') {
      const rows = await StaffProfile.find({ $or: [
        { firstName: new RegExp(term, 'i') },
        { lastName: new RegExp(term, 'i') },
        { employeeId: new RegExp(term, 'i') },
      ] }).limit(limit).lean();
      return res.status(200).json({ success: true, value: rows.map(r => ({ kind: 'staff', id: r._id, firstName: r.firstName, lastName: r.lastName, employeeId: r.employeeId, department: r.department })) });
    }
    // default student
    const rows = await StudentProfile.find({ $or: [
      { firstName: new RegExp(term, 'i') },
      { lastName: new RegExp(term, 'i') },
      { admissionNo: new RegExp(term, 'i') },
    ] }).limit(limit).lean();
    return res.status(200).json({ success: true, value: rows.map(r => ({ kind: 'student', id: r._id, firstName: r.firstName, lastName: r.lastName, admissionNo: r.admissionNo })) });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
