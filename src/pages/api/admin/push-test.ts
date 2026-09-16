import type { NextApiRequest, NextApiResponse } from 'next';
import { sendAdminPushNotification } from '@/lib/push';
import { requireAdminRole } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  
  try {
    requireAdminRole(req);
  } catch {
    return res.status(401).end();
  }

  await sendAdminPushNotification('Test Push', 'Push notifications are working!', '/admin');
  res.status(200).json({ success: true });
}
