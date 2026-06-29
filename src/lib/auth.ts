import jwt from 'jsonwebtoken';
import { NextApiRequest } from 'next';
import cookie from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export interface AdminPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  forcePasswordReset?: boolean;
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

// ── RBAC Middlewares ───────────────────────────────────────────────

export function requireAdmin(req: NextApiRequest): AdminPayload {
  const admin = getAdminFromRequest(req);
  if (!admin) {
    throw new Error('Unauthorized');
  }
  // Allow them to hit the change-password API endpoint if they need a reset
  if (admin.forcePasswordReset && !req.url?.includes('change-password')) {
    throw new Error('Forbidden: Password Reset Required');
  }
  return admin;
}

export function requireSuperAdmin(req: NextApiRequest): AdminPayload {
  const admin = requireAdmin(req);
  if (admin.role !== 'super_admin') {
    throw new Error('Forbidden: Super Admin access required');
  }
  return admin;
}

export function requireAdminRole(req: NextApiRequest): AdminPayload {
  const admin = requireAdmin(req);
  if (!['super_admin', 'admin'].includes(admin.role)) {
    throw new Error('Forbidden: Admin access required');
  }
  return admin;
}

export function requireEditorRole(req: NextApiRequest): AdminPayload {
  const admin = requireAdmin(req);
  if (!['super_admin', 'admin', 'editor'].includes(admin.role)) {
    throw new Error('Forbidden: Editor access required');
  }
  return admin;
}

export function requireViewerRole(req: NextApiRequest): AdminPayload {
  const admin = requireAdmin(req);
  if (!['super_admin', 'admin', 'editor', 'viewer'].includes(admin.role)) {
    throw new Error('Forbidden: Viewer access required');
  }
  return admin;
}
