import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import MenuItem from '../../../../src/server/db/models/MenuItem.js';
import { authOptions } from '../../auth/[...nextauth].js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  if (session.user?.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });
  await dbConnect();

  try {
    if (req.method === 'GET') {
      const items = await MenuItem.find({}).sort({ order: 1 }).lean();
      return res.status(200).json({ success: true, value: items });
    }
    if (req.method === 'POST') {
      const { label, url, icon, active = true, parent = null, order = 0 } = req.body || {};
      if (!label) return res.status(400).json({ success: false, message: 'label required' });
      const created = await MenuItem.create({ label, url, icon, active, parent, order });
      return res.status(201).json({ success: true, value: created });
    }
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
