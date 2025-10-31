import { getServerSession } from 'next-auth';
import dbConnect from '../../../src/server/db/config.mjs';
import menuService from '../../../src/server/services/menuService.js';
import { authOptions } from '../auth/[...nextauth].js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await dbConnect();
  try {
  const role = session.user?.role || 'student';
  const menu = await menuService.getMenuForRole(role);
    return res.status(200).json({ success: true, value: menu });
  } catch (err) {
    return res.status(500).json({ success: false, message: err?.message || 'Failed to load menu' });
  }
}
