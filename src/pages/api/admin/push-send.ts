import type { NextApiRequest, NextApiResponse } from 'next';
import { sendAdminPushNotification } from '@/lib/push';

/**
 * Internal endpoint called by the Storefront app to trigger push notifications.
 * Protected by a shared INTERNAL_API_SECRET env variable.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const secret = process.env.INTERNAL_API_SECRET;
  if (secret && req.headers['x-internal-secret'] !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { title, body, url } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'title and body are required' });

  await sendAdminPushNotification(title, body, url || '/admin');
  res.status(200).json({ success: true });
}
