import { inviteUser } from '@/server/services/authService';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }
  const session = await getServerSession(req, res, authOptions);
  const role = session?.user?.role;
  if (!session || !role || (role !== 'admin' && role !== 'staff')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { email, role: inviteRole, ttlMinutes, meta } = req.body || {};
  if (!email || !inviteRole) {
    return res.status(400).json({ success: false, message: 'email and role are required' });
  }
  // staff can only invite students
  if (role === 'staff' && inviteRole !== 'student') {
    return res.status(403).json({ success: false, message: 'Staff can only invite students' });
  }

  try {
    const invite = await inviteUser(email, inviteRole, { ttlMinutes, meta });
    return res.status(200).json({ success: true, ...invite });
  } catch (e) {
    return res.status(400).json({ success: false, message: e?.message || 'Failed to invite user' });
  }
}
