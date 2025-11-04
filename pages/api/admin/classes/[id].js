import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import ClassModel from '../../../../src/server/db/models/Class.js';
import StaffProfile from '../../../../src/server/db/models/StaffProfile.js';
import Subject from '../../../../src/server/db/models/Subject.js';
import permissionService from '../../../../src/server/services/permissionService.js';
import { authOptions } from '../../auth/[...nextauth].js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/admin/classes');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

  const { id } = req.query;
  try {
    if (req.method === 'GET') {
      const item = await ClassModel.findById(id)
        .populate('classTeacher', 'firstName lastName employeeId')
        .populate('subjects', 'name subjectCode')
        .lean();
      if (!item) return res.status(404).json({ success: false, message: 'Not found' });
      return res.status(200).json({ success: true, value: {
        ...item,
        _id: item._id?.toString?.(),
        classTeacher: item.classTeacher && typeof item.classTeacher === 'object'
          ? {
            _id: item.classTeacher._id?.toString?.(),
            name: [item.classTeacher.firstName, item.classTeacher.lastName].filter(Boolean).join(' ') || item.classTeacher.employeeId || 'Staff',
            employeeId: item.classTeacher.employeeId,
          }
          : item.classTeacher,
        subjects: Array.isArray(item.subjects)
          ? item.subjects.map(sub => ({ _id: sub._id?.toString?.(), name: sub.name, subjectCode: sub.subjectCode }))
          : [],
      } });
    }
    if (req.method === 'PUT') {
      const { name, level, year, classTeacher, subjects } = req.body || {};

      if (classTeacher) {
        const staffExists = await StaffProfile.exists({ _id: classTeacher });
        if (!staffExists) return res.status(400).json({ success: false, message: 'Invalid class teacher' });
      }

      if (Array.isArray(subjects) && subjects.length) {
        const subjectCount = await Subject.countDocuments({ _id: { $in: subjects } });
        if (subjectCount !== subjects.length) return res.status(400).json({ success: false, message: 'Invalid subjects' });
      }

      const updated = await ClassModel.findByIdAndUpdate(
        id,
        { name, level, year, classTeacher: classTeacher || undefined, subjects: subjects || [] },
        { new: true, runValidators: true }
      )
        .populate('classTeacher', 'firstName lastName employeeId')
        .populate('subjects', 'name subjectCode');

      if (!updated) return res.status(404).json({ success: false, message: 'Not found' });

      return res.status(200).json({ success: true, value: {
        ...updated.toObject(),
        _id: updated._id?.toString?.(),
        classTeacher: updated.classTeacher && typeof updated.classTeacher === 'object'
          ? {
            _id: updated.classTeacher._id?.toString?.(),
            name: [updated.classTeacher.firstName, updated.classTeacher.lastName].filter(Boolean).join(' ') || updated.classTeacher.employeeId || 'Staff',
            employeeId: updated.classTeacher.employeeId,
          }
          : updated.classTeacher,
        subjects: Array.isArray(updated.subjects)
          ? updated.subjects.map(sub => ({ _id: sub._id?.toString?.(), name: sub.name, subjectCode: sub.subjectCode }))
          : [],
      } });
    }
    if (req.method === 'DELETE') {
      await ClassModel.findByIdAndDelete(id);
      return res.status(200).json({ success: true });
    }
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
