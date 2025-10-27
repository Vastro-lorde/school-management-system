import { resetPassword } from '../../../src/server/services/authService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await resetPassword(req.body.token, req.body.password);
    res.status(200).json({ success: true, message: 'Password has been reset' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}