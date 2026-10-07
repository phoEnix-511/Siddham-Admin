import type { NextApiRequest, NextApiResponse } from 'next';
import { requireSuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { delPattern } from '@/lib/cache';

/**
 * POST /api/admin/purge-orders
 *
 * Super-Admin only endpoint to purge all order history:
 * - Deletes all OrderItems
 * - Deletes all Orders
 * - Cleans order caches and order notification queues from Redis
 * - Leaves all Products, Categories, Customers, Settings intact
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    requireSuperAdmin(req);
  } catch {
    return res.status(401).json({ error: 'Unauthorized: Super Admin access required' });
  }

  try {
    // Count before deleting for confirmation feedback
    const [orderCount, itemCount] = await Promise.all([
      prisma.order.count(),
      prisma.orderItem.count(),
    ]);

    // Delete in sequence: order items first to satisfy foreign key constraints, then orders
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});

    // Purge order-related cache keys from Redis
    try {
      await Promise.all([
        delPattern('orders:'),
        delPattern('notifications:new_orders'),
        delPattern('reports:'),
      ]);
    } catch (cacheErr) {
      console.warn('[purge-orders] Failed to purge order caches:', cacheErr);
    }

    return res.status(200).json({
      success: true,
      message: `Successfully purged ${orderCount} orders and ${itemCount} order items. Products and customer accounts remain intact.`,
      purged: {
        orders: orderCount,
        orderItems: itemCount,
      },
    });
  } catch (error: any) {
    console.error('[purge-orders] Error during purge:', error);
    return res.status(500).json({ error: error?.message || 'Failed to purge order data' });
  }
}
