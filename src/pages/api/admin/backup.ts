import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    requireSuperAdmin(req);
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
        addresses,
        accounts,
        sessions,
        reviews,
        productVariants,
        rewardTransactions,
        bundleOffers
      ] = await Promise.all([
        prisma.category.findMany(),
        prisma.product.findMany(),
        prisma.setting.findMany(),
        prisma.adminUser.findMany(),
        prisma.customer.findMany(),
        prisma.order.findMany(),
        prisma.orderItem.findMany(),
        prisma.address.findMany(),
        prisma.account.findMany(),
        prisma.session.findMany(),
        prisma.review.findMany(),
        prisma.productVariant.findMany(),
        prisma.rewardTransaction.findMany(),
        prisma.bundleOffer.findMany()
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
          addresses,
          accounts,
          sessions,
          reviews,
          productVariants,
          rewardTransactions,
          bundleOffers
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
