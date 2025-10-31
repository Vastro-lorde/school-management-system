import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import User from '../../../../src/server/db/models/User.js';
import permissionService from '../../../../src/server/services/permissionService.js';
import { authOptions } from '../../auth/[...nextauth].js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/admin/users');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

  try {
    if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });

    const total = await User.countDocuments({});
    const active = await User.countDocuments({ isActive: true });
    const byRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const createdLast30 = await User.countDocuments({ createdAt: { $gte: since } });
    const loggedInLast30 = await User.countDocuments({ lastLogin: { $gte: since } });

    return res.status(200).json({ success: true, value: { total, active, byRole, createdLast30, loggedInLast30 } });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
