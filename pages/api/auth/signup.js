import { signUp } from '../../../src/server/services/authService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { user, profile } = await signUp(req.body);
    res.status(201).json({ success: true, user, profile });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}