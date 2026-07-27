import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminRole } from '@/lib/auth';
import { delPattern } from '@/lib/cache';
import { warmUpSearchCache } from '@/lib/cacheWarmup';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    requireAdminRole(req);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Purge all Redis cache patterns
    await Promise.all([
      delPattern('settings:'),
      delPattern('products:'),
      delPattern('categories:'),
      delPattern('orders:'),
      delPattern('reports:'),
    ]);

    // Re-warm search cache in background
    warmUpSearchCache().catch(err => {
      console.error('[purge-cache] Search warm up error:', err);
    });

    return res.status(200).json({
      success: true,
      message: 'All system caches have been purged and search cache refreshed.',
    });
  } catch (error) {
    console.error('[purge-cache] Failed to purge cache:', error);
    return res.status(500).json({ error: 'Failed to clear system cache' });
  }
}
