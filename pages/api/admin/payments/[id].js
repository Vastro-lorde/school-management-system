import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import Payment from '../../../../src/server/db/models/Payment.js';
import permissionService from '../../../../src/server/services/permissionService.js';
import { authOptions } from '../../auth/[...nextauth].js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/admin/payments');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

  const { id } = req.query;
  try {
    if (req.method === 'GET') {
      const item = await Payment.findById(id)
        .populate('type', 'name')
        .populate('classes', 'name')
        .populate('subjects', 'name')
        .populate('departments', 'name')
        .populate('items.item', 'name')
        .lean();
      if (!item) return res.status(404).json({ success: false, message: 'Not found' });
      return res.status(200).json({ success: true, value: item });
    }
    if (req.method === 'PUT') {
      const { title, description, type, classes, subjects, departments, items, effectiveDate, dueDate, active } = req.body || {};
      if (classes && (!Array.isArray(classes) || classes.length === 0)) return res.status(400).json({ success: false, message: 'at least one class required' });
      if (items && (!Array.isArray(items) || items.length === 0)) return res.status(400).json({ success: false, message: 'at least one payment item required' });
      const normalizedItems = Array.isArray(items) ? items.map(li => ({ item: li.item || li.itemId, amount: Number(li.amount) })) : undefined;
      const update = { title, description, type, classes, subjects, departments, effectiveDate, dueDate, active };
      if (normalizedItems) update.items = normalizedItems;
      const updated = await Payment.findByIdAndUpdate(id, update, { new: true });
      return res.status(200).json({ success: true, value: updated });
    }
    if (req.method === 'DELETE') {
      await Payment.findByIdAndDelete(id);
      return res.status(200).json({ success: true });
    }
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
