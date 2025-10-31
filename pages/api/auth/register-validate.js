import { validateRegistrationToken } from '../../../src/server/services/authService.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }
  const { token } = req.query;
  if (!token) return res.status(400).json({ success: false, message: 'Token is required' });
  try {
    const data = await validateRegistrationToken(token);
    res.status(200).json({ success: true, ...data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}
