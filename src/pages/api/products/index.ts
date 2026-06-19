import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { generateSlug } from '@/lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      let isAdmin = false;
      try {
        requireAdmin(req);
        isAdmin = true;
      } catch {
        // Not admin
      }

      const { category, featured, search, page = '1', limit = '12', showInactive } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const where: Record<string, unknown> = {};
      if (!isAdmin || showInactive !== 'true') {
        where.isActive = true;
      }
      if (category) where.category = { slug: category };
      if (featured === 'true') where.isFeatured = true;
      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: { category: true, variants: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.product.count({ where }),
      ]);

      return res.status(200).json({
        products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }
  }

  if (req.method === 'POST') {
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

    if (!name || !description || !price || !categoryId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const slug = generateSlug(name);
      const product = await prisma.product.create({
        data: {
          name, description, slug, price: parseFloat(price),
          comparePrice: comparePrice ? parseFloat(comparePrice) : null,
          images: images || [], stock: parseInt(stock) || 0,
          sku: sku || null, isActive: isActive ?? true,
          isFeatured: isFeatured ?? false,
          ingredients: ingredients || null, benefits: benefits || null,
          usage: usage || null, weight: weight || null,
          videoUrl: videoUrl || null, categoryId,
          variants: variants && variants.length > 0 ? {
            create: variants.map((v: any) => ({
              name: v.name,
              price: parseFloat(v.price),
              comparePrice: v.comparePrice ? parseFloat(v.comparePrice) : null,
              stock: parseInt(v.stock) || 0,
              sku: v.sku || null,
            }))
          } : undefined,
        },
        include: { category: true, variants: true },
      });
      return res.status(201).json({ product });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to create product' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
