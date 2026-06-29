import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    requireSuperAdmin(req);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const admins = await prisma.adminUser.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          lastLogin: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return res.status(200).json({ admins });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to fetch admin users' });
    }
  }

  if (req.method === 'POST') {
    const { name, email, password, role = 'admin' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields: name, email, password' });
    }

    try {
      // Check if email already exists in admin user table
      const existingAdmin = await prisma.adminUser.findUnique({
        where: { email },
      });
      if (existingAdmin) {
        return res.status(409).json({ error: 'Email already in use by another admin' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      const newAdmin = await prisma.adminUser.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      return res.status(201).json({ admin: newAdmin });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to create admin user' });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Missing admin user ID' });
    }

    try {
      // Ensure we don't delete the last admin
      const adminCount = await prisma.adminUser.count();
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the only remaining admin account.' });
      }

      await prisma.adminUser.delete({
        where: { id },
      });

      return res.status(200).json({ success: true, message: 'Admin deleted successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to delete admin user' });
    }
  }

  if (req.method === 'PUT') {
    const { id, action, role } = req.body;
    
    if (action === 'reset_password' && id) {
      try {
        const tempPassword = Math.random().toString(36).slice(-8); // Generate 8 char password
        const hashedPassword = await bcrypt.hash(tempPassword, 12);
        
        await prisma.adminUser.update({
          where: { id },
          data: {
            password: hashedPassword,
            forcePasswordReset: true,
          }
        });
        
        return res.status(200).json({ success: true, tempPassword });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to reset password' });
      }
    }

    if (action === 'update_role' && id && role) {
      try {
        // Validate role is one of the allowed ones
        if (!['super_admin', 'admin', 'editor', 'viewer'].includes(role)) {
          return res.status(400).json({ error: 'Invalid role' });
        }

        // Do not allow updating self role to avoid lockouts (optional check is done on client, but double check in UI/API if ID matches requester)
        // Wait, requireSuperAdmin ensures only superadmins can run this, but a superadmin could demote themselves.
        // We can do self-check in API too if we want, but since requireSuperAdmin throws if not super_admin, we can just allow it or rely on client block.
        await prisma.adminUser.update({
          where: { id },
          data: { role }
        });
        
        return res.status(200).json({ success: true });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to update role' });
      }
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
