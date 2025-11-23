import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import Timetable from '../../../../src/server/db/models/Timetable.js';
import User from '../../../../src/server/db/models/User.js';
import StudentProfile from '../../../../src/server/db/models/StudentProfile.js';
import permissionService from '../../../../src/server/services/permissionService.js';
import { authOptions } from '../../auth/[...nextauth].js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/student/timetable');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

  try {
    if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });
    const user = await User.findById(session.user?.id).select('profileRef').lean();
    const student = await StudentProfile.findById(user?.profileRef).select('classId').lean();
    if (!student?.classId) return res.status(200).json({ success: true, value: [] });
    const entries = await Timetable.find({ classId: student.classId })
      .populate({ path: 'periods.subjectId', select: 'name subjectCode' })
      .populate({ path: 'periods.teacherId', select: 'firstName lastName department' })
      .lean();
    return res.status(200).json({ success: true, value: entries });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}