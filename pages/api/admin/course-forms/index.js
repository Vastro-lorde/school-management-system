import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import CourseForm from '../../../../src/server/db/models/CourseForm.js';
import permissionService from '../../../../src/server/services/permissionService.js';
import { authOptions } from '../../auth/[...nextauth].js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/admin/course-forms');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

  try {
    if (req.method === 'GET') {
      const { status } = req.query;
      const q = {};
      if (status) q.status = status;
      const rows = await CourseForm.find(q)
        .populate('courses','code title')
        .populate('facultyId','name')
        .populate('departmentId','name code')
        .sort({ createdAt: -1 })
        .lean();
      return res.status(200).json({ success: true, value: rows });
    }

    if (req.method === 'POST') {
      const { name, sessionId, semester, facultyId, departmentId, courseIds, status, approved } = req.body || {};
      if (!sessionId || !semester || !Array.isArray(courseIds) || courseIds.length === 0) {
        return res.status(400).json({ success: false, message: 'sessionId, semester and courseIds required' });
      }
      const doc = await CourseForm.create({ name, sessionId, semester, facultyId: facultyId||null, departmentId: departmentId||null, courses: courseIds, status: status||'draft', approved: !!approved, createdBy: session.user?.id });
      return res.status(200).json({ success: true, value: doc });
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = req.body || {};
      if (!id) return res.status(400).json({ success: false, message: 'id required' });
      if (updates.courseIds) { updates.courses = updates.courseIds; delete updates.courseIds; }
      if (updates.publish === true) { updates.status = 'published'; updates.approved = true; updates.approvedBy = session.user?.id; updates.approvedAt = new Date(); delete updates.publish; }
      if (updates.close === true) { updates.status = 'closed'; delete updates.close; }
      const updated = await CourseForm.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
      return res.status(200).json({ success: true, value: updated });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query || {};
      if (!id) return res.status(400).json({ success: false, message: 'id required' });
      await CourseForm.deleteOne({ _id: id });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
