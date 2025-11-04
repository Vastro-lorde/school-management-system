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

  try {
    if (req.method === 'GET') {
      const items = await ClassModel.find({})
        .populate('classTeacher', 'firstName lastName employeeId')
        .populate('subjects', 'name subjectCode')
        .sort({ createdAt: -1 })
        .lean();
      return res.status(200).json({ success: true, value: items.map(item => ({
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
          ? item.subjects.map(sub => typeof sub === 'object'
            ? { _id: sub._id?.toString?.(), name: sub.name, subjectCode: sub.subjectCode }
            : sub)
          : [],
      })) });
    }
    if (req.method === 'POST') {
      const { name, level, year, classTeacher, subjects } = req.body || {};
      if (!name) return res.status(400).json({ success: false, message: 'name required' });

      if (classTeacher) {
        const staffExists = await StaffProfile.exists({ _id: classTeacher });
        if (!staffExists) return res.status(400).json({ success: false, message: 'Invalid class teacher' });
      }

      if (Array.isArray(subjects) && subjects.length) {
        const subjectCount = await Subject.countDocuments({ _id: { $in: subjects } });
        if (subjectCount !== subjects.length) return res.status(400).json({ success: false, message: 'Invalid subjects' });
      }

      const created = await ClassModel.create({
        name,
        level,
        year,
        classTeacher: classTeacher || undefined,
        subjects: subjects || [],
      });
      const populated = await ClassModel.findById(created._id)
        .populate('classTeacher', 'firstName lastName employeeId')
        .populate('subjects', 'name subjectCode')
        .lean();
      return res.status(201).json({ success: true, value: {
        ...populated,
        _id: populated._id?.toString?.(),
        classTeacher: populated.classTeacher && typeof populated.classTeacher === 'object'
          ? {
            _id: populated.classTeacher._id?.toString?.(),
            name: [populated.classTeacher.firstName, populated.classTeacher.lastName].filter(Boolean).join(' ') || populated.classTeacher.employeeId || 'Staff',
            employeeId: populated.classTeacher.employeeId,
          }
          : populated.classTeacher,
        subjects: Array.isArray(populated.subjects)
          ? populated.subjects.map(sub => ({ _id: sub._id?.toString?.(), name: sub.name, subjectCode: sub.subjectCode }))
          : [],
      } });
    }
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
