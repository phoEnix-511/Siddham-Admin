import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { productId, name, rating, comment } = req.body;

  if (!productId || !name || rating === undefined || !comment) {
    return res.status(400).json({ error: 'Missing required review fields' });
  }

  const ratingInt = parseInt(rating);
  if (isNaN(ratingInt) || ratingInt < 1 || ratingInt > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5 stars' });
  }

  try {
    // Verify product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const review = await prisma.review.create({
      data: {
        productId,
        name,
        rating: ratingInt,
        comment,
      },
    });

    return res.status(201).json({ review });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to create product review' });
  }
}
