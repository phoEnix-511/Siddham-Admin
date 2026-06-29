import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Use getAdminFromRequest to avoid the strict requireAdmin check which blocks if forcePasswordReset is true
  const adminPayload = getAdminFromRequest(req);
  if (!adminPayload) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { password } = req.body;
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.adminUser.update({
      where: { id: adminPayload.id },
      data: {
        password: hashedPassword,
        forcePasswordReset: false,
      },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[change-password] Error:', error);
    return res.status(500).json({ error: 'Failed to update password' });
  }
}
