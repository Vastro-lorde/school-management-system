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

  try {
    if (req.method === 'GET') {
      const items = await Course.find({})
        .populate('department', 'name code')
        .sort({ createdAt: -1 })
        .lean();
      return res.status(200).json({ success: true, value: items.map(mapCourse) });
    }

    if (req.method === 'POST') {
      const { title, code, description, department, creditHours, level, active } = req.body || {};
      if (!title) return res.status(400).json({ success: false, message: 'title required' });
      if (!code) return res.status(400).json({ success: false, message: 'code required' });

      let departmentId = department || undefined;
      if (departmentId) {
        const deptExists = await Department.exists({ _id: departmentId });
        if (!deptExists) return res.status(400).json({ success: false, message: 'Invalid department' });
      }

      try {
        const created = await Course.create({
          title,
          code,
          description,
          department: departmentId || undefined,
          creditHours,
          level,
          active: active !== undefined ? !!active : true,
        });
        const populated = await Course.findById(created._id).populate('department', 'name code').lean();
        return res.status(201).json({ success: true, value: mapCourse(populated) });
      } catch (err) {
        if (err?.code === 11000) {
          return res.status(409).json({ success: false, message: 'Course code already exists' });
        }
        throw err;
      }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
