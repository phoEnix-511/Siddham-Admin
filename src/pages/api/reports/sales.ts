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

  const { startDate, endDate } = req.query;

  const where: Record<string, unknown> = {
    paymentStatus: 'PAID',
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, Date>).gte = new Date(startDate as string);
    if (endDate) {
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      (where.createdAt as Record<string, Date>).lte = end;
    }
  }

  try {
    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Aggregate data
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrders = orders.length;

    // Daily summary
    const dailyMap: Record<string, { date: string; orders: number; revenue: number }> = {};
    for (const order of orders) {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!dailyMap[date]) dailyMap[date] = { date, orders: 0, revenue: 0 };
      dailyMap[date].orders += 1;
      dailyMap[date].revenue += order.totalAmount;
    }
    const daily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    // Product-level breakdown
    const productMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
    for (const order of orders) {
      for (const item of order.items) {
        const key = item.productId;
        if (!productMap[key]) productMap[key] = { name: item.product.name, quantity: 0, revenue: 0 };
        productMap[key].quantity += item.quantity;
        productMap[key].revenue += item.price * item.quantity;
      }
    }
    const productBreakdown = Object.values(productMap).sort((a, b) => b.revenue - a.revenue);

    // Format for download
    const csv = [
      'Order Number,Date,Customer,Email,Phone,Products,Total (INR),Payment Status,Order Status',
      ...orders.map(o =>
        [
          o.orderNumber,
          o.createdAt.toISOString().split('T')[0],
          o.customer.name,
          o.customer.email,
          o.customer.phone || '',
          o.items.map(i => `${i.product.name} x${i.quantity}`).join('; '),
          o.totalAmount.toFixed(2),
          o.paymentStatus,
          o.status,
        ].join(',')
      ),
    ].join('\n');

    return res.status(200).json({ totalRevenue, totalOrders, daily, productBreakdown, csv });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to generate sales report' });
  }
}
