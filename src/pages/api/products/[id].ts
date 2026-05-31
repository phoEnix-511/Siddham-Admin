import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { generateSlug } from '@/lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const productId = id as string;

  if (req.method === 'GET') {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { category: true },
      });
      if (!product) return res.status(404).json({ error: 'Product not found' });
      return res.status(200).json({ product });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to fetch product' });
    }
  }

  if (req.method === 'PUT') {
    try {
      requireAdmin(req);
    } catch {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      name, description, price, comparePrice, images, stock, sku,
      isActive, isFeatured, ingredients, benefits, usage, weight, categoryId,
    } = req.body;

    try {
      const updateData: Record<string, unknown> = {
        description, images, isActive, isFeatured,
        ingredients, benefits, usage, weight, categoryId,
      };

      if (name) {
        updateData.name = name;
        updateData.slug = generateSlug(name);
      }
      if (price !== undefined) updateData.price = parseFloat(price);
      if (comparePrice !== undefined) updateData.comparePrice = comparePrice ? parseFloat(comparePrice) : null;
      if (stock !== undefined) updateData.stock = parseInt(stock);
      if (sku !== undefined) updateData.sku = sku;

      const product = await prisma.product.update({
        where: { id: productId },
        data: updateData,
        include: { category: true },
      });
      return res.status(200).json({ product });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to update product' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      requireAdmin(req);
    } catch {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      await prisma.product.delete({ where: { id: productId } });
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to delete product' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
