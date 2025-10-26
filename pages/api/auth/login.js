import { login } from '../../../server/services/authService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { user, token } = await login(req.body.email, req.body.password);
    res.status(200).json({ success: true, user, token });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
}