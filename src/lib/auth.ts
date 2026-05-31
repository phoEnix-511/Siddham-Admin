import jwt from 'jsonwebtoken';
import { NextApiRequest } from 'next';
import cookie from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export interface AdminPayload {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function signToken(payload: AdminPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AdminPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminPayload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: NextApiRequest): string | null {
  const cookies = cookie.parse(req.headers.cookie || '');
  return cookies.admin_token || null;
}

export function getAdminFromRequest(req: NextApiRequest): AdminPayload | null {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}

export function requireAdmin(req: NextApiRequest): AdminPayload {
  const admin = getAdminFromRequest(req);
  if (!admin) {
    throw new Error('Unauthorized');
  }
  return admin;
}
