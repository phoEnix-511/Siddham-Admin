import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { generateOrderNumber } from '@/lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      requireAdmin(req);
    } catch {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { status, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: true,
          items: { include: { product: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.order.count({ where }),
    ]);

    return res.status(200).json({
      orders,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  }

  if (req.method === 'POST') {
    const {
      items, customerName, customerEmail, customerPhone,
      shippingAddress, notes,
    } = req.body;

    if (!items?.length || !customerName || !customerEmail || !shippingAddress) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      // Find or create customer
      let customer = await prisma.customer.findUnique({ where: { email: customerEmail } });
      if (!customer) {
        customer = await prisma.customer.create({
          data: { email: customerEmail, name: customerName, phone: customerPhone },
        });
      }

      // Fetch products and calculate total
      const productIds = items.map((i: { productId: string }) => i.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
      });

      let totalAmount = 0;
      const orderItems = items.map((item: { productId: string; quantity: number }) => {
        const product = products.find(p => p.id === item.productId);
        if (!product) throw new Error(`Product ${item.productId} not found`);
        if (product.stock < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);
        totalAmount += product.price * item.quantity;
        return {
          productId: item.productId,
          quantity: item.quantity,
          price: product.price,
        };
      });

      const shippingAmount = totalAmount >= 999 ? 0 : 99;
      const taxAmount = 0; // GST can be added later

      const order = await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          customerId: customer.id,
          totalAmount: totalAmount + shippingAmount,
          shippingAmount,
          taxAmount,
          shippingAddress,
          notes: notes || null,
          items: { create: orderItems },
        },
        include: {
          customer: true,
          items: { include: { product: true } },
        },
      });

      // Reduce stock
      for (const item of items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return res.status(201).json({ order });
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Failed to create order';
      return res.status(500).json({ error: message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
