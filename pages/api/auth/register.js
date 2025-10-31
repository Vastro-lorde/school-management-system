import { completeRegistration } from '../../../src/server/services/authService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }
  const { token, ...payload } = req.body || {};
  if (!token) return res.status(400).json({ success: false, message: 'Token is required' });
  try {
    const { user, profile } = await completeRegistration(token, payload);
    res.status(201).json({ success: true, userId: user._id, profileId: profile?._id });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}
