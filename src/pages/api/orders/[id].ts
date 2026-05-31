import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const order = await prisma.order.findUnique({
        where: { id: id as string },
        include: {
          customer: true,
          items: { include: { product: { include: { category: true } } } },
        },
      });
      if (!order) return res.status(404).json({ error: 'Order not found' });
      return res.status(200).json({ order });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to fetch order' });
    }
  }

  if (req.method === 'PUT') {
    try {
      requireAdmin(req);
    } catch {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { status, paymentStatus } = req.body;
    try {
      const order = await prisma.order.update({
        where: { id: id as string },
        data: {
          ...(status && { status }),
          ...(paymentStatus && { paymentStatus }),
        },
        include: {
          customer: true,
          items: { include: { product: true } },
        },
      });
      return res.status(200).json({ order });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to update order' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
