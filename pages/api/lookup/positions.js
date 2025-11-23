import { getServerSession } from 'next-auth';
import dbConnect from '../../../src/server/db/config.mjs';
import Position from '../../../src/server/db/models/Position.js';
import permissionService from '../../../src/server/services/permissionService.js';
import { authOptions } from '../auth/[...nextauth].js';

// GET /api/lookup/positions -> list positions (optionally filter by allowedRoles)
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  try {
    if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });

    // Access: anyone with access to either admin or staff student-positions can read
    const role = session.user?.role || 'student';
    const allowAdmin = await permissionService.hasAccessToUrl(role, '/admin/student-positions');
    const allowStaff = await permissionService.hasAccessToUrl(role, '/staff/student-positions');
    if (!allowAdmin && !allowStaff) return res.status(403).json({ success: false, message: 'Forbidden' });

    const { forRole } = req.query || {};
    const query = {};
    if (forRole) {
      query.$or = [
        { allowedRoles: { $exists: false } },
        { allowedRoles: { $size: 0 } },
        { allowedRoles: forRole },
      ];
    }
    const rows = await Position.find(query).select('_id name code allowedRoles staffOnly').sort({ name: 1 }).lean();
    return res.status(200).json({ success: true, value: rows });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
