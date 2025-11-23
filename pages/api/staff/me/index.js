import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import StaffProfile from '../../../../src/server/db/models/StaffProfile.js';
import Position from '../../../../src/server/db/models/Position.js';
import permissionService from '../../../../src/server/services/permissionService.js';
import { authOptions } from '../../auth/[...nextauth].js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'staff';
  const allowed = await permissionService.hasAccessToUrl(role, '/staff/my-profile');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });
  try {
    const profile = await StaffProfile.findOne({ userId: session.user?.id }).populate('positionId','name code').lean();
    return res.status(200).json({ success: true, value: profile });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
