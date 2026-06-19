import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { generateSlug } from '@/lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const categories = await prisma.category.findMany({
        include: {
          _count: {
            select: {
              products: {
                where: { isActive: true }
              }
            }
          }
        },
        orderBy: { name: 'asc' },
      });
      return res.status(200).json({ categories });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }
  }

  if (req.method === 'POST') {
    try {
      requireAdmin(req);
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
      return res.status(201).json({ category });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to create category' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
