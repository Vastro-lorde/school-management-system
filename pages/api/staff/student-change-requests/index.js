import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import StudentChangeRequest from '../../../../src/server/db/models/StudentChangeRequest.js';
import StudentProfile from '../../../../src/server/db/models/StudentProfile.js';
import User from '../../../../src/server/db/models/User.js';
import StaffProfile from '../../../../src/server/db/models/StaffProfile.js';
import Position from '../../../../src/server/db/models/Position.js';
import permissionService from '../../../../src/server/services/permissionService.js';
import { authOptions } from '../../auth/[...nextauth].js';

// HOD view: staff with position HOD in same department can approve
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/staff/student-change-requests');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

  try {
    const userId = session.user?.id;
  const staff = await StaffProfile.findOne({ userId }).select('department departmentId positionId').lean();
    const position = staff?.positionId ? await Position.findById(staff.positionId).select('name').lean() : null;
    const isHOD = position && /hod/i.test(position.name);

    if (req.method === 'GET') {
      // If HOD: show pending requests for department; else show own submitted requests
      if (isHOD) {
  const dept = staff?.departmentId || staff?.department;
        const requests = await StudentChangeRequest.find({ status: 'pending' })
          .populate('studentId')
          .populate('requestedBy','email')
          .sort({ createdAt: -1 })
          .lean();
  const filtered = dept ? requests.filter(r => String(r.departmentId||'') === String(dept||'')) : requests;
        return res.status(200).json({ success: true, value: filtered });
      } else {
        const own = await StudentChangeRequest.find({ requestedBy: userId })
          .populate('studentId')
          .sort({ createdAt: -1 })
          .lean();
        return res.status(200).json({ success: true, value: own });
      }
    }

    if (req.method === 'POST') {
      // Bulk or single approval/rejection by HOD
      if (!isHOD) return res.status(403).json({ success: false, message: 'HOD only action' });
      const { requestIds, action } = req.body || {};
      if (!Array.isArray(requestIds) || requestIds.length === 0) return res.status(400).json({ success: false, message: 'requestIds required' });
      if (!['approve','reject'].includes(action)) return res.status(400).json({ success: false, message: 'Invalid action' });

  const docs = await StudentChangeRequest.find({ _id: { $in: requestIds }, status: 'pending' }).lean();
  const dept = staff?.departmentId || staff?.department;
  const scoped = dept ? docs.filter(d => String(d.departmentId||'') === String(dept)) : docs;

      const status = action === 'approve' ? 'approved' : 'rejected';
      const now = new Date();

      for (const d of scoped) {
        await StudentChangeRequest.updateOne({ _id: d._id }, { $set: { status, approvedBy: userId, approvedAt: now } });
        if (status === 'approved') {
          // Apply changes to StudentProfile
          await StudentProfile.updateOne({ _id: d.studentId }, { $set: d.changes });
        }
      }
      return res.status(200).json({ success: true, value: { count: scoped.length, status } });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
