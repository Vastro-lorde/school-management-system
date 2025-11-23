import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import User from '../../../../src/server/db/models/User.js';
import StudentProfile from '../../../../src/server/db/models/StudentProfile.js';
import Grade from '../../../../src/server/db/models/Grade.js';
import Subject from '../../../../src/server/db/models/Subject.js';
import permissionService from '../../../../src/server/services/permissionService.js';
import { authOptions } from '../../auth/[...nextauth].js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/student/scores');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });
  try {
    if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });
    const user = await User.findById(session.user?.id).select('profileRef').lean();
    const profileId = user?.profileRef;
    if (!profileId) return res.status(400).json({ success: false, message: 'Student profile not found' });
    const grades = await Grade.find({ studentId: profileId })
      .populate('subjectId', 'name subjectCode department')
      .populate('assessmentId', 'title type')
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, value: grades });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}