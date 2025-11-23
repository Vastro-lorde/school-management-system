import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import User from '../../../../src/server/db/models/User.js';
import StudentProfile from '../../../../src/server/db/models/StudentProfile.js';
import Class from '../../../../src/server/db/models/Class.js';
// Legacy subject registration removed; keep optional import placeholder if needed in future
// import Subject from '../../../../src/server/db/models/Subject.js';
import permissionService from '../../../../src/server/services/permissionService.js';
import { authOptions } from '../../auth/[...nextauth].js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/student/details');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });
  try {
    if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });
    const user = await User.findById(session.user?.id).select('email profileRef').lean();
    const profile = await StudentProfile.findById(user?.profileRef).lean();
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
  let classDoc = null;
  if (profile.classId) classDoc = await Class.findById(profile.classId).lean();
  // registeredSubjects removed; return empty array for backward compatibility with UI expecting field
  return res.status(200).json({ success: true, value: { user, profile, class: classDoc, registeredSubjects: [] } });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}