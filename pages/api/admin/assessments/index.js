import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import Assessment from '../../../../src/server/db/models/Assessment.js';
import permissionService from '../../../../src/server/services/permissionService.js';
import { authOptions } from '../../auth/[...nextauth].js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/admin/assessments');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

  try {
    if (req.method === 'GET') {
      const items = await Assessment.find({}).sort({ createdAt: -1 }).lean();
      return res.status(200).json({ success: true, value: items });
    }
    if (req.method === 'POST') {
      const { title, kind, classIds = [], subjectIds = [], startAt, endAt, description } = req.body || {};
      if (!title || !kind) return res.status(400).json({ success: false, message: 'title and kind required' });
      const created = await Assessment.create({ title, kind, classIds, subjectIds, startAt, endAt, description, status: 'scheduled' });
      return res.status(201).json({ success: true, value: created });
    }
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
