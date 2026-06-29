import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdminRole } from '@/lib/auth';
import { generateSlug } from '@/lib/utils';
import { getOrSet, del } from '@/lib/cache';

const CACHE_KEY = 'categories:all';
const CACHE_TTL = 60 * 60 * 24; // 24 hours - categories rarely change

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const categories = await getOrSet(CACHE_KEY, CACHE_TTL, () =>
        prisma.category.findMany({
          include: {
            _count: {
              select: {
                products: { where: { isActive: true } },
              },
            },
          },
          orderBy: { name: 'asc' },
        })
      );

      // Allow browsers and CDNs to cache for 1h; serve stale up to 24h while revalidating
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      return res.status(200).json({ categories });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }
  }

  if (req.method === 'POST') {
    try {
      requireAdminRole(req);
    } catch {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, description, imageUrl } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    try {
      const slug = generateSlug(name);
      const category = await prisma.category.create({
        data: { name, slug, description: description || null, imageUrl: imageUrl || null },
      });

      // Invalidate category cache so next GET returns fresh data
      await del(CACHE_KEY);

      return res.status(201).json({ category });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to create category' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}