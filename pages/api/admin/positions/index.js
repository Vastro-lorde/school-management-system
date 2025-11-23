import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import Position from '../../../../src/server/db/models/Position.js';
import User from '../../../../src/server/db/models/User.js';
import permissionService from '../../../../src/server/services/permissionService.js';
import { authOptions } from '../../auth/[...nextauth].js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/admin/positions');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

  try {
    if (req.method === 'GET') {
      const list = await Position.find({}).sort({ name: 1 }).lean();
      return res.status(200).json({ success: true, value: list });
    }
    if (req.method === 'POST') {
      const { name, code, description, allowedRoles, staffOnly } = req.body || {};
      if (!name) return res.status(400).json({ success: false, message: 'name required' });
      const exists = await Position.findOne({ name }).lean();
      if (exists) return res.status(400).json({ success: false, message: 'Position exists' });
      const created = await Position.create({ name, code, description, allowedRoles, staffOnly });
      return res.status(201).json({ success: true, value: created });
    }
    if (req.method === 'PUT') {
      const { id, ...rest } = req.body || {};
      if (!id) return res.status(400).json({ success: false, message: 'id required' });
      const updated = await Position.findByIdAndUpdate(id, { $set: rest }, { new: true }).lean();
      return res.status(200).json({ success: true, value: updated });
    }
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ success: false, message: 'id required' });
      await Position.deleteOne({ _id: id });
      return res.status(200).json({ success: true, value: true });
    }
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
