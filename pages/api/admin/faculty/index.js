import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import Faculty from '../../../../src/server/db/models/Faculty.js';
import Department from '../../../../src/server/db/models/Department.js';
import StaffProfile from '../../../../src/server/db/models/StaffProfile.js';
import permissionService from '../../../../src/server/services/permissionService.js';
import { authOptions } from '../../auth/[...nextauth].js';

function mapFaculty(doc) {
  if (!doc) return doc;
  const dean = doc.dean && typeof doc.dean === 'object'
    ? {
        _id: doc.dean._id?.toString?.(),
        name: [doc.dean.firstName, doc.dean.lastName].filter(Boolean).join(' ') || doc.dean.employeeId || 'Staff',
        employeeId: doc.dean.employeeId,
      }
    : doc.dean;
  const departments = Array.isArray(doc.departments)
    ? doc.departments.map(dep =>
        typeof dep === 'object'
          ? { _id: dep._id?.toString?.(), name: dep.name, code: dep.code }
          : dep
      )
    : [];
  return {
    _id: doc._id?.toString?.(),
    name: doc.name,
    description: doc.description || '',
    dean,
    departments,
    contactEmail: doc.contactEmail || '',
    contactPhone: doc.contactPhone || '',
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
  const allowed = await permissionService.hasAccessToUrl(role, '/admin/faculty');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

  try {
    if (req.method === 'GET') {
      const items = await Faculty.find({})
        .populate('dean', 'firstName lastName employeeId')
        .populate('departments', 'name code')
        .sort({ createdAt: -1 })
        .lean();
      return res.status(200).json({ success: true, value: items.map(mapFaculty) });
    }

    if (req.method === 'POST') {
      const { name, description, dean, departments, contactEmail, contactPhone, active } = req.body || {};
      if (!name) return res.status(400).json({ success: false, message: 'name required' });

      if (dean) {
        const staffExists = await StaffProfile.exists({ _id: dean });
        if (!staffExists) return res.status(400).json({ success: false, message: 'Invalid faculty head' });
      }

      if (Array.isArray(departments) && departments.length) {
        const deptCount = await Department.countDocuments({ _id: { $in: departments } });
        if (deptCount !== departments.length) {
          return res.status(400).json({ success: false, message: 'Invalid departments' });
        }
      }

      try {
        const created = await Faculty.create({
          name,
          description,
          dean: dean || undefined,
          departments: departments || [],
          contactEmail,
          contactPhone,
          active: active !== undefined ? !!active : true,
        });
        const populated = await Faculty.findById(created._id)
          .populate('dean', 'firstName lastName employeeId')
          .populate('departments', 'name code')
          .lean();
        return res.status(201).json({ success: true, value: mapFaculty(populated) });
      } catch (err) {
        if (err?.code === 11000) {
          return res.status(409).json({ success: false, message: 'Faculty already exists' });
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
