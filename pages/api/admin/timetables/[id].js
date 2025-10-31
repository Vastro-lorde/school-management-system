import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import Timetable from '../../../../src/server/db/models/Timetable.js';
import permissionService from '../../../../src/server/services/permissionService.js';
import { authOptions } from '../../auth/[...nextauth].js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/admin/timetables');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

  const { id } = req.query;
  try {
    if (req.method === 'GET') {
      const item = await Timetable.findById(id).lean();
      if (!item) return res.status(404).json({ success: false, message: 'Not found' });
      return res.status(200).json({ success: true, value: item });
    }
    if (req.method === 'PUT') {
      const { classId, day, periods, assessmentId } = req.body || {};
      const updated = await Timetable.findByIdAndUpdate(id, { classId, day, periods, assessmentId }, { new: true });
      return res.status(200).json({ success: true, value: updated });
    }
    if (req.method === 'DELETE') {
      await Timetable.findByIdAndDelete(id);
      return res.status(200).json({ success: true });
    }
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
