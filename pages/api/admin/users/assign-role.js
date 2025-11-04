import { getServerSession } from 'next-auth';
import dbConnect from '@/server/db/config';
import User from '@/server/db/models/User';
import Role from '@/server/db/models/Role';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  if (session.user?.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });

  await dbConnect();

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { userId, role } = req.body || {};
    if (!userId || !role) {
      return res.status(400).json({ success: false, message: 'userId and role are required' });
    }

    const roleDoc = await Role.findOne({ name: role, active: true }).lean();
    if (!roleDoc) return res.status(400).json({ success: false, message: 'Role does not exist or is inactive' });

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await User.updateOne({ _id: userId }, { $set: { role } });

    return res.status(200).json({ success: true, message: 'Role assigned successfully' });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
