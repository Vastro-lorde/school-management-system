import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import ClassModel from '../../../../src/server/db/models/Class.js';
import permissionService from '../../../../src/server/services/permissionService.js';
import { authOptions } from '../../auth/[...nextauth].js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/staff/register-student');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

  try {
    const classes = await ClassModel.find({}, { name: 1, level: 1, year: 1 }).sort({ name: 1 }).lean();
    return res.status(200).json({
      success: true,
      value: {
        classes: classes.map(c => ({ _id: c._id.toString(), name: c.name, level: c.level || '', year: c.year || '' })),
        genders: ['male', 'female', 'other'],
      },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
