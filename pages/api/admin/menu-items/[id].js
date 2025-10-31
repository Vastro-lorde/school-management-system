import { getServerSession } from 'next-auth';
import dbConnect from '../../../../src/server/db/config.mjs';
import MenuItem from '../../../../src/server/db/models/MenuItem.js';
import { authOptions } from '../../auth/[...nextauth].js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  if (session.user?.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden' });
  await dbConnect();

  const { id } = req.query;
  try {
    if (req.method === 'GET') {
      const item = await MenuItem.findById(id).lean();
      if (!item) return res.status(404).json({ success: false, message: 'Not found' });
      return res.status(200).json({ success: true, value: item });
    }
    if (req.method === 'PUT') {
      const { label, url, icon, active, parent, order } = req.body || {};
      const updated = await MenuItem.findByIdAndUpdate(id, { label, url, icon, active, parent, order }, { new: true });
      return res.status(200).json({ success: true, value: updated });
    }
    if (req.method === 'DELETE') {
      await MenuItem.findByIdAndDelete(id);
      return res.status(200).json({ success: true });
    }
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
}
