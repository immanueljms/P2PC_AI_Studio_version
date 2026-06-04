import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDb } from './database';

export const SECRET_KEY = 'p2pc_super_secret_key_change_in_production';

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(user: { id: number; username: string; role: string }): string {
  return jwt.sign({ sub: user.username, id: user.id, role: user.role }, SECRET_KEY, {
    expiresIn: '10h'
  });
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    credits: number;
  };
}

export async function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'No authorization header provided' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: 'Authorization bearer token missing' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as { id: number; sub: string; role: string };
    const db = await getDb();
    const user = await db.get('SELECT id, username, role, credits FROM users WHERE id = ?', [decoded.id]);
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'User does not exist' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}
