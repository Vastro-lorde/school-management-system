import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import { authOptions } from '../../auth/[...nextauth].js';
import permissionService from '../../../../src/server/services/permissionService.js';
import StaffProfile from '../../../../src/server/db/models/StaffProfile.js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const role = session.user?.role || 'student';
  // Allow access if the user has access to timetables page (used by its UI)
  const ok = await permissionService.hasAccessToUrl(role, '/admin/timetables');
  if (!ok) return res.status(403).json({ success: false, message: 'Forbidden' });

  await dbConnect();

  if (req.method === 'GET') {
    try {
      const staff = await StaffProfile.find({}, { firstName: 1, lastName: 1, employeeId: 1 }).lean();
      const value = staff.map(s => ({
        _id: s._id.toString(),
        name: [s.firstName, s.lastName].filter(Boolean).join(' ') || s.employeeId || 'Staff',
        employeeId: s.employeeId || '',
      }));
      return res.json({ success: true, value });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message || 'Failed' });
    }
  }

  res.setHeader('Allow', ['GET']);
  return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
}
