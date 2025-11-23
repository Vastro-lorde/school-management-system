import { getServerSession } from 'next-auth';
import dbConnect from '../../../../../src/server/db/config.mjs';
import StaffProfile from '../../../../../src/server/db/models/StaffProfile.js';
import User from '../../../../../src/server/db/models/User.js';
import Position from '../../../../../src/server/db/models/Position.js';
import permissionService from '../../../../../src/server/services/permissionService.js';
import { authOptions } from '../../../auth/[...nextauth].js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/admin/staffs');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });
  try {
    const { id } = req.query;
    if (req.method === 'GET') {
      const profile = await StaffProfile.findById(id).populate('positionId','name code').lean();
      if (!profile) return res.status(404).json({ success: false, message: 'Not found' });
      const user = await User.findOne({ profileRef: profile._id }).select('email role isActive').lean();
      return res.status(200).json({ success: true, value: { profile, user } });
    }
    if (req.method === 'PUT') {
      const { updates } = req.body || {};
      if (!updates || typeof updates !== 'object') return res.status(400).json({ success: false, message: 'updates required' });
      const updated = await StaffProfile.findByIdAndUpdate(id, { $set: updates }, { new: true }).populate('positionId','name code').lean();
      return res.status(200).json({ success: true, value: updated });
    }
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
