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
        include: {
          category: true,
          variants: true,
          reviews: { orderBy: { createdAt: 'desc' } },
        },
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
      isActive, isFeatured, ingredients, benefits, usage, weight, videoUrl, categoryId,
      variants,
    } = req.body;

    try {
      const updateData: Record<string, unknown> = {
        description, images, isActive, isFeatured,
        ingredients, benefits, usage, weight, categoryId,
        videoUrl: videoUrl !== undefined ? (videoUrl || null) : undefined,
      };

      if (name) {
        updateData.name = name;
        updateData.slug = generateSlug(name);
      }
      if (price !== undefined) updateData.price = parseFloat(price);
      if (comparePrice !== undefined) updateData.comparePrice = comparePrice ? parseFloat(comparePrice) : null;
      if (stock !== undefined) updateData.stock = parseInt(stock);
      if (sku !== undefined) updateData.sku = sku || null;

      // Handle variant updates if present
      if (variants !== undefined) {
        const existingVariants = await prisma.productVariant.findMany({
          where: { productId },
        });
        const existingIds = existingVariants.map(v => v.id);
        const incomingIds = variants.map((v: any) => v.id).filter(Boolean);

        // Delete variants not in incoming list
        const idsToDelete = existingIds.filter(id => !incomingIds.includes(id));
        if (idsToDelete.length > 0) {
          await prisma.productVariant.deleteMany({
            where: { id: { in: idsToDelete } },
          });
        }

        // Upsert incoming variants
        for (const v of variants) {
          if (v.id) {
            await prisma.productVariant.update({
              where: { id: v.id },
              data: {
                name: v.name,
                price: parseFloat(v.price),
                comparePrice: v.comparePrice ? parseFloat(v.comparePrice) : null,
                stock: parseInt(v.stock) || 0,
                sku: v.sku || null,
              },
            });
          } else {
            await prisma.productVariant.create({
              data: {
                productId,
                name: v.name,
                price: parseFloat(v.price),
                comparePrice: v.comparePrice ? parseFloat(v.comparePrice) : null,
                stock: parseInt(v.stock) || 0,
                sku: v.sku || null,
              },
            });
          }
        }
      }

      const product = await prisma.product.update({
        where: { id: productId },
        data: updateData,
        include: { category: true, variants: true },
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
      const orderItemCount = await prisma.orderItem.count({
        where: { productId },
      });

      if (orderItemCount > 0) {
        // Soft delete by marking it inactive
        await prisma.product.update({
          where: { id: productId },
          data: { isActive: false },
        });
        return res.status(200).json({ success: true, message: 'Product soft-deleted (marked inactive) since it is referenced in orders.' });
      }

      await prisma.product.delete({ where: { id: productId } });
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to delete product' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
