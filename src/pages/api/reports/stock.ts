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

  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { stock: 'asc' },
    });

    const LOW_STOCK_THRESHOLD = 10;

    const stockData = products.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku || 'N/A',
      category: p.category.name,
      stock: p.stock,
      status: p.stock === 0 ? 'OUT_OF_STOCK' : p.stock <= LOW_STOCK_THRESHOLD ? 'LOW_STOCK' : 'IN_STOCK',
      price: p.price,
      isActive: p.isActive,
    }));

    const summary = {
      total: stockData.length,
      inStock: stockData.filter(p => p.status === 'IN_STOCK').length,
      lowStock: stockData.filter(p => p.status === 'LOW_STOCK').length,
      outOfStock: stockData.filter(p => p.status === 'OUT_OF_STOCK').length,
    };

    const csv = [
      'Product Name,SKU,Category,Stock Quantity,Status,Price (INR),Active',
      ...stockData.map(p =>
        [p.name, p.sku, p.category, p.stock, p.status, p.price.toFixed(2), p.isActive].join(',')
      ),
    ].join('\n');

    return res.status(200).json({ stockData, summary, csv });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to generate stock report' });
  }
}
