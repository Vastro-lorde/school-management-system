import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import User from '../../../../src/server/db/models/User.js';
import StaffProfile from '../../../../src/server/db/models/StaffProfile.js';
import Position from '../../../../src/server/db/models/Position.js';
import permissionService from '../../../../src/server/services/permissionService.js';
import { authOptions } from '../../auth/[...nextauth].js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/admin/assign-positions');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

  try {
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });
  const { userId, staffId, positionId } = req.body || {};
  if ((!userId && !staffId) || !positionId) return res.status(400).json({ success: false, message: 'staffId or userId and positionId required' });

    let targetUserId = userId;
    let staff = null;
    if (!targetUserId && staffId) {
      // Find staff profile to map to userId
      staff = await StaffProfile.findById(staffId).select('userId').lean();
      targetUserId = staff?.userId;
    }
    const [user, position] = await Promise.all([
      User.findById(targetUserId).select('role').lean(),
      Position.findById(positionId).lean(),
    ]);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!position) return res.status(404).json({ success: false, message: 'Position not found' });

    // Enforce allowed roles
    if (position.staffOnly && user.role !== 'staff') {
      return res.status(400).json({ success: false, message: 'Position restricted to staff' });
    }
    if (Array.isArray(position.allowedRoles) && position.allowedRoles.length > 0 && !position.allowedRoles.includes(user.role)) {
      return res.status(400).json({ success: false, message: 'User role not eligible for position' });
    }

  if (!staff) staff = await StaffProfile.findOne({ userId: targetUserId }).lean();
  if (!staff) return res.status(400).json({ success: false, message: 'Staff profile not found' });

    // One position per staff: store on StaffProfile as 'positionId'
  const updated = await StaffProfile.findByIdAndUpdate(staff._id, { $set: { positionId } }, { new: true }).lean();
    return res.status(200).json({ success: true, value: updated });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
