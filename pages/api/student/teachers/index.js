import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import User from '../../../../src/server/db/models/User.js';
import StudentProfile from '../../../../src/server/db/models/StudentProfile.js';
import Timetable from '../../../../src/server/db/models/Timetable.js';
import permissionService from '../../../../src/server/services/permissionService.js';
import { authOptions } from '../../auth/[...nextauth].js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/student/teachers');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });
  try {
    if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });
    const user = await User.findById(session.user?.id).select('profileRef').lean();
  const profile = await StudentProfile.findById(user?.profileRef).select('classId').lean();
    if (!profile?.classId) return res.status(200).json({ success: true, value: [] });

    const tt = await Timetable.find({ classId: profile.classId })
      .populate({ path: 'periods.subjectId', select: 'name subjectCode department' })
      .populate({ path: 'periods.teacherId', select: 'firstName lastName department' })
      .lean();
    const map = new Map(); // key: subjectId -> {subject, teachers:Set}
    for (const day of tt) {
      for (const p of day.periods || []) {
        if (!p.subjectId || !p.teacherId) continue;
        const sid = String(p.subjectId._id || p.subjectId);
        if (!map.has(sid)) map.set(sid, { subject: p.subjectId, teachers: new Map() });
        const rec = map.get(sid);
        const tid = String(p.teacherId._id || p.teacherId);
        if (!rec.teachers.has(tid)) rec.teachers.set(tid, p.teacherId);
      }
    }
    const value = [...map.values()].map(v => ({ subject: v.subject, teachers: [...v.teachers.values()] }));
    return res.status(200).json({ success: true, value });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}