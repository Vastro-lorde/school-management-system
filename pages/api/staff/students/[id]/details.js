import { getServerSession } from 'next-auth';
import dbConnect from '../../../../../src/server/db/config.mjs';
import StudentProfile from '../../../../../src/server/db/models/StudentProfile.js';
import User from '../../../../../src/server/db/models/User.js';
import permissionService from '../../../../../src/server/services/permissionService.js';
import { authOptions } from '../../../auth/[...nextauth].js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/staff/student-lookup'); // reuse permission
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });
  try {
    if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });
    const { id } = req.query;
    const profile = await StudentProfile.findById(id).lean();
    if (!profile) return res.status(404).json({ success: false, message: 'Not found' });
    const user = await User.findOne({ profileRef: profile._id }).select('email isActive').lean();
    return res.status(200).json({ success: true, value: { profile, user } });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
