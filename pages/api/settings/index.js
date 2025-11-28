import dbConnect from '@/server/db/config';
import Setting from '@/server/db/models/Setting';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const settings = await Setting.find({}).lean();
      return res.status(200).json({ success: true, value: settings });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  res.setHeader('Allow', ['GET']);
  return res.status(405).json({ success: false, message: `Method ${req.method} not allowed.` });
}
