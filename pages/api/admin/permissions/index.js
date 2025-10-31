import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import permissionService from '../../../../src/server/services/permissionService.js';
import { authOptions } from '../../auth/[...nextauth].js';
import enums from '../../../../src/constants/enums.mjs';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  if (session.user?.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });
  await dbConnect();

  const { ROLES } = enums;

  if (req.method === 'GET') {
    const role = (req.query.role || '').toString();
    if (!role || !ROLES.includes(role) || role === 'admin') {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    try {
      const [menuItems, allowedIds] = await Promise.all([
        permissionService.listActiveMenuItems(),
        permissionService.getRolePermissionIds(role),
      ]);
      return res.status(200).json({ success: true, value: { menuItems, allowedIds } });
    } catch (e) {
      return res.status(500).json({ success: false, message: e?.message || 'Failed to load permissions' });
    }
  }

  if (req.method === 'POST') {
    const { role, allowedIds } = req.body || {};
    if (!role || !Array.isArray(allowedIds)) {
      return res.status(400).json({ success: false, message: 'role and allowedIds required' });
    }
    if (!ROLES.includes(role) || role === 'admin') {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    try {
      await permissionService.setRolePermissionIds(role, allowedIds);
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ success: false, message: e?.message || 'Failed to save permissions' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}
