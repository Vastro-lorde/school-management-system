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

  try {
    if (req.method === 'GET') {
      const items = await Payment.find({})
        .populate('type', 'name')
        .populate('classes', 'name')
        .populate('subjects', 'name')
        .populate('departments', 'name')
        .populate('items.item', 'name')
        .sort({ createdAt: -1 })
        .lean();
      return res.status(200).json({ success: true, value: items });
    }
    if (req.method === 'POST') {
      const { title, description, type, classes, subjects, departments, items, effectiveDate, dueDate, active } = req.body || {};
      if (!title) return res.status(400).json({ success: false, message: 'title required' });
      if (!type) return res.status(400).json({ success: false, message: 'type required' });
      if (!Array.isArray(classes) || classes.length === 0) return res.status(400).json({ success: false, message: 'at least one class required' });
      if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ success: false, message: 'at least one payment item required' });
      const normalizedItems = items.map(li => ({ item: li.item || li.itemId, amount: Number(li.amount) }));
      const created = await Payment.create({ title, description, type, classes, subjects, departments, items: normalizedItems, effectiveDate, dueDate, active });
      return res.status(201).json({ success: true, value: created });
    }
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
