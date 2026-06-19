import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    requireAdmin(req);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const [
        categories,
        products,
        settings,
        adminUsers,
        customers,
        orders,
        orderItems,
      ] = await Promise.all([
        prisma.category.findMany(),
        prisma.product.findMany(),
        prisma.setting.findMany(),
        prisma.adminUser.findMany({
          select: { id: true, email: true, name: true, role: true, createdAt: true },
        }),
        prisma.customer.findMany(),
        prisma.order.findMany(),
        prisma.orderItem.findMany(),
      ]);

      const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: {
          categories,
          products,
          settings,
          adminUsers,
          customers,
          orders,
          orderItems,
        },
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=siddham-db-backup-${new Date().toISOString().split('T')[0]}.json`);
      return res.status(200).json(backup);
    } catch (error) {
      console.error('[backup] Export failed:', error);
      return res.status(500).json({ error: 'Export failed' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
