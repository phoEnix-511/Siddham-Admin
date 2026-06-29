import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdminRole, requireViewerRole } from '@/lib/auth';

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
      const settings = await prisma.setting.findMany({ orderBy: { group: 'asc' } });
      const settingsMap: Record<string, string> = {};
      settings.forEach(s => {
        if (!isAdmin) {
          const lowerKey = s.key.toLowerCase();
          if (lowerKey.includes('secret') || lowerKey.includes('password')) {
            return;
          }
        }
        settingsMap[s.key] = s.value;
      });
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
      await prisma.$transaction(updates);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to update settings' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
