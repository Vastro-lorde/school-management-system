import { forgotPassword } from '../../../server/services/authService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await forgotPassword(req.body.email);
    res.status(200).json({ success: true, message: 'Password reset email sent' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}