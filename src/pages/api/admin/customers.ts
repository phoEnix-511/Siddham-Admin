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
      const customers = await prisma.customer.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          lastLogin: true,
          createdAt: true,
          addresses: {
            select: {
              address: true,
              city: true,
              state: true,
              pincode: true,
              isDefault: true,
            }
          },
          _count: {
            select: { orders: true }
          }
        },
        orderBy: { createdAt: 'desc' },
      });
      return res.status(200).json({ customers });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to fetch customers' });
    }
  }

  if (req.method === 'PUT') {
    const { id, action } = req.body;
    
    if (action === 'reset_password' && id) {
      try {
        const tempPassword = Math.random().toString(36).slice(-8); // Generate 8 char password
        const hashedPassword = await bcrypt.hash(tempPassword, 12);
        
        await prisma.customer.update({
          where: { id },
          data: {
            hashedPassword: hashedPassword,
            forcePasswordReset: true,
          }
        });
        
        return res.status(200).json({ success: true, tempPassword });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to reset password' });
      }
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
