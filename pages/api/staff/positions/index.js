import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import Position from '../../../../src/server/db/models/Position.js';
import permissionService from '../../../../src/server/services/permissionService.js';
import { authOptions } from '../../auth/[...nextauth].js';

// GET /api/staff/positions -> list positions that can be assigned to students
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/staff/student-positions');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });
  try {
    if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });
    // Positions where allowedRoles empty OR includes 'student'
    const rows = await Position.find({ $or: [ { allowedRoles: { $exists: false } }, { allowedRoles: { $size: 0 } }, { allowedRoles: 'student' } ] })
      .select('_id name code allowedRoles')
      .sort({ name: 1 })
      .lean();
    return res.status(200).json({ success: true, value: rows });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
