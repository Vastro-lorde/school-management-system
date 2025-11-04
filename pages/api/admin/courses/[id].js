import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import Course from '../../../../src/server/db/models/Course.js';
import Department from '../../../../src/server/db/models/Department.js';
import permissionService from '../../../../src/server/services/permissionService.js';
import { authOptions } from '../../auth/[...nextauth].js';

function mapCourse(doc) {
  if (!doc) return doc;
  const department = doc.department && typeof doc.department === 'object'
    ? { _id: doc.department._id?.toString?.(), name: doc.department.name, code: doc.department.code }
    : doc.department;
  return {
    _id: doc._id?.toString?.(),
    title: doc.title,
    code: doc.code,
    description: doc.description || '',
    department,
    creditHours: doc.creditHours ?? 0,
    level: doc.level || '',
    active: !!doc.active,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/admin/courses');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      const item = await Course.findById(id).populate('department', 'name code').lean();
      if (!item) return res.status(404).json({ success: false, message: 'Not found' });
      return res.status(200).json({ success: true, value: mapCourse(item) });
    }

    if (req.method === 'PUT') {
      const { title, code, description, department, creditHours, level, active } = req.body || {};
      if (department) {
        const deptExists = await Department.exists({ _id: department });
        if (!deptExists) return res.status(400).json({ success: false, message: 'Invalid department' });
      }

      try {
        const updated = await Course.findByIdAndUpdate(
          id,
          {
            title,
            code,
            description,
            department: department || undefined,
            creditHours,
            level,
            active,
          },
          { new: true, runValidators: true }
        ).populate('department', 'name code');
        if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
        return res.status(200).json({ success: true, value: mapCourse(updated.toObject()) });
      } catch (err) {
        if (err?.code === 11000) {
          return res.status(409).json({ success: false, message: 'Course code already exists' });
        }
        throw err;
      }
    }

    if (req.method === 'DELETE') {
      await Course.findByIdAndDelete(id);
      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
