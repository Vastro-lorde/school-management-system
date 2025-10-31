import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import Role from '../../../../src/server/db/models/Role.js';
import Permission from '../../../../src/server/db/models/Permission.js';
import permissionService from '../../../../src/server/services/permissionService.js';
import { authOptions } from '../../auth/[...nextauth].js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const roleName = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(roleName, '/admin/roles');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

  const { id } = req.query;
  try {
    const role = await Role.findById(id);
    if (!role) return res.status(404).json({ success: false, message: 'Not found' });

    if (req.method === 'GET') {
      return res.status(200).json({ success: true, value: role });
    }

    if (req.method === 'PUT') {
      const prevName = role.name;
      const { name, description, active } = req.body || {};
      if (role.system && name && name !== prevName) {
        return res.status(400).json({ success: false, message: 'Cannot rename a system role' });
      }
      role.description = description ?? role.description;
      if (typeof active === 'boolean') role.active = active;
      if (name && name !== prevName) {
        role.name = String(name).toLowerCase();
      }
      await role.save();
      // propagate rename to permissions if name changed
      if (name && name !== prevName) {
        await Permission.updateMany({ role: prevName }, { $set: { role: role.name } });
      }
      return res.status(200).json({ success: true, value: role });
    }

    if (req.method === 'DELETE') {
      if (role.system) return res.status(400).json({ success: false, message: 'Cannot delete a system role' });
      const name = role.name;
      await role.deleteOne();
      await Permission.deleteMany({ role: name });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
