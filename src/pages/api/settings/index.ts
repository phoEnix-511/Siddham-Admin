import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdminRole, requireViewerRole } from '@/lib/auth';
import { getOrSet, del, delPattern } from '@/lib/cache';

const SETTINGS_CACHE_TTL = 60 * 10; // 10 minutes

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    let isAdmin = false;
    try {
      requireViewerRole(req);
      isAdmin = true;
    } catch {
      // not admin
    }

    try {
      const cacheKey = isAdmin ? 'settings:admin' : 'settings:public';
      const settingsMap = await getOrSet(cacheKey, SETTINGS_CACHE_TTL, async () => {
        const settings = await prisma.setting.findMany({ orderBy: { group: 'asc' } });
        const map: Record<string, string> = {};
        const PUBLIC_KEYS = [
          'store_name', 'store_email', 'store_phone', 'store_instagram', 'store_facebook', 
          'announcement_bar_text', 'announcement_bar_enabled', 'catalog_mode', 
          'hero_title', 'hero_subtitle', 'hero_badge', 'currency', 
          'shipping_free_above', 'shipping_standard_rate', 'about_us_content', 
          'loyalty_points_rate', 'loyalty_min_redeem', 'free_shipping_threshold'
        ];
        
        settings.forEach(s => {
          if (!isAdmin) {
            const lowerKey = s.key.toLowerCase();
            if (!PUBLIC_KEYS.includes(lowerKey)) {
              return;
            }
          }
          map[s.key] = s.value;
        });
        return map;
      });

      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
      return res.status(200).json({ settings: settingsMap });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }

  if (req.method === 'PUT') {
    try {
      requireAdminRole(req);
    } catch {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings data' });
    }

    try {
      const updates = Object.entries(settings as Record<string, string>).map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value, group: key.startsWith('razorpay') ? 'payment' : 'general' },
        })
      );
      await Promise.all(updates);

      // Invalidate settings cache
      await Promise.all([
        del('settings:admin'),
        del('settings:public'),
        delPattern('settings:'),
      ]);

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to update settings' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
