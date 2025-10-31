import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import Role from '../../../../src/server/db/models/Role.js';
import Permission from '../../../../src/server/db/models/Permission.js';
import permissionService from '../../../../src/server/services/permissionService.js';
import { authOptions } from '../../auth/[...nextauth].js';

const PROTECTED = new Set(['admin', 'student']);

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/admin/roles');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

  try {
    if (req.method === 'GET') {
      const items = await Role.find({}).sort({ name: 1 }).lean();
      return res.status(200).json({ success: true, value: items });
    }
    if (req.method === 'POST') {
      const { name, description, active } = req.body || {};
      if (!name) return res.status(400).json({ success: false, message: 'name required' });
      const doc = await Role.create({ name, description, active, system: PROTECTED.has(String(name).toLowerCase()) });
      return res.status(201).json({ success: true, value: doc });
    }
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
