import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    requireAdmin(req);
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

  return res.status(405).json({ error: 'Method not allowed' });
}
