import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/nextauth';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const customer = await prisma.customer.findUnique({
      where: { email: session.user.email },
      include: {
        orders: {
          include: {
            items: { include: { product: { select: { name: true } } } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    return res.status(200).json({ orders: customer?.orders || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
}
