import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    requireAdmin(req);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const [
      totalProducts, totalOrders, totalCustomers,
      revenueResult, recentOrders, lowStockProducts,
      pendingOrders,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.customer.count(),
      prisma.order.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { totalAmount: true },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: true },
      }),
      prisma.product.findMany({
        where: { stock: { lte: 10 } },
        orderBy: { stock: 'asc' },
        take: 5,
        include: { category: true },
      }),
      prisma.order.count({ where: { status: 'PENDING' } }),
    ]);

    return res.status(200).json({
      stats: {
        totalProducts,
        totalOrders,
        totalCustomers,
        totalRevenue: revenueResult._sum.totalAmount || 0,
        pendingOrders,
      },
      recentOrders,
      lowStockProducts,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
}
