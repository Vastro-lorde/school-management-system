import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/constants/env';

const secret = JWT_SECRET || 'a-fallback-secret-for-development';

export function generateToken(user) {
  return jwt.sign({ userId: user._id, role: user.role }, secret, { expiresIn: '1h' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}