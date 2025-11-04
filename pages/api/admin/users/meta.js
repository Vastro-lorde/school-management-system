import { getServerSession } from 'next-auth';
import dbConnect from '@/server/db/config';
import User from '@/server/db/models/User';
import Role from '@/server/db/models/Role';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  if (session.user?.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });

  await dbConnect();
  try {
    const users = await User.find({}).select('email role').lean();
    const roles = await Role.find({ active: true }).select('name description').lean();
    return res.status(200).json({ success: true, value: {
      users: users.map(u => ({ id: u._id, email: u.email, role: u.role })),
      roles: roles.map(r => ({ name: r.name, description: r.description })),
    }});
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
