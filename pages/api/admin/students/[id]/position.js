import { getServerSession } from 'next-auth';
import dbConnect from '../../../../../src/server/db/config.mjs';
import StudentProfile from '../../../../../src/server/db/models/StudentProfile.js';
import Position from '../../../../../src/server/db/models/Position.js';
import permissionService from '../../../../../src/server/services/permissionService.js';
import { authOptions } from '../../../auth/[...nextauth].js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/admin/student-positions');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

  try {
    if (req.method !== 'PUT') return res.status(405).json({ success: false, message: 'Method not allowed' });
    const { id } = req.query || {};
    const { positionId } = req.body || {};
    if (!id) return res.status(400).json({ success: false, message: 'Student id required' });

    if (positionId) {
      const pos = await Position.findById(positionId).lean();
      if (!pos) return res.status(400).json({ success: false, message: 'Invalid position' });
      if (Array.isArray(pos.allowedRoles) && pos.allowedRoles.length > 0 && !pos.allowedRoles.includes('student')) {
        return res.status(400).json({ success: false, message: 'Position not allowed for students' });
      }
    }

    const updated = await StudentProfile.findByIdAndUpdate(id, { $set: { positionId: positionId || null } }, { new: true }).populate('positionId','name code').lean();
    return res.status(200).json({ success: true, value: updated });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
