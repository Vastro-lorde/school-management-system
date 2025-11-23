import { getServerSession } from 'next-auth';
import dbConnect from '../../../src/server/db/config.mjs';
import Memo from '../../../src/server/db/models/Memo.js';
import User from '../../../src/server/db/models/User.js';
import StudentProfile from '../../../src/server/db/models/StudentProfile.js';
import StaffProfile from '../../../src/server/db/models/StaffProfile.js';
import permissionService from '../../../src/server/services/permissionService.js';
import { authOptions } from '../auth/[...nextauth].js';

// GET /api/memos?box=inbox|outbox
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/memos/inbox');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

  try {
    if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });
    const box = (req.query.box || 'inbox').toLowerCase();
    const userId = session.user?.id;

    // Load department/faculty for current user for group targeting
    let deptId = null;
    let facultyId = null;
    const userDoc = await User.findById(userId).select('profileRef profileModel').lean();
    if (userDoc?.profileRef && userDoc?.profileModel === 'StudentProfile') {
      const sp = await StudentProfile.findById(userDoc.profileRef).select('departmentId facultyId').lean();
      deptId = sp?.departmentId || null;
      facultyId = sp?.facultyId || null;
    } else if (userDoc?.profileRef && userDoc?.profileModel === 'StaffProfile') {
      const st = await StaffProfile.findById(userDoc.profileRef).select('departmentId facultyId').lean();
      deptId = st?.departmentId || null;
      facultyId = st?.facultyId || null;
    }

    let filter = {};
    if (box === 'outbox') {
      filter = { senderUserId: userId };
    } else {
      // inbox: recipient matches user, their role, their department or faculty
      const ors = [
        { 'recipients.type': 'user', 'recipients.userId': userId },
        { 'recipients.type': 'role', 'recipients.role': role },
      ];
      if (deptId) ors.push({ 'recipients.type': 'department', 'recipients.departmentId': deptId });
      if (facultyId) ors.push({ 'recipients.type': 'faculty', 'recipients.facultyId': facultyId });
      filter = { $or: ors };
    }

    const rows = await Memo.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const enriched = rows.map(r => ({
      _id: r._id,
      subject: r.subject,
      createdAt: r.createdAt,
      senderUserId: r.senderUserId,
      recipients: r.recipients,
      type: r.type,
      status: r.status,
      unread: !r.readBy?.some(rb => String(rb.userId) === String(userId)),
    }));

    return res.status(200).json({ success: true, value: enriched });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
