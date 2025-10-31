import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import PaymentItem from '../../../../src/server/db/models/PaymentItem.js';
import permissionService from '../../../../src/server/services/permissionService.js';
import { authOptions } from '../../auth/[...nextauth].js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  const role = session.user?.role || 'student';
  const allowed = await permissionService.hasAccessToUrl(role, '/admin/payment-items');
  if (!allowed) return res.status(403).json({ success: false, message: 'Forbidden' });

  try {
    if (req.method === 'GET') {
      const items = await PaymentItem.find({}).sort({ createdAt: -1 }).lean();
      return res.status(200).json({ success: true, value: items });
    }
    if (req.method === 'POST') {
      const { name, code, description, defaultAmount, active } = req.body || {};
      if (!name) return res.status(400).json({ success: false, message: 'name required' });
      const created = await PaymentItem.create({ name, code, description, defaultAmount, active });
      return res.status(201).json({ success: true, value: created });
    }
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
