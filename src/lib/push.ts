import webpush from 'web-push';
import { prisma } from './prisma';
import { Redis } from '@upstash/redis';

webpush.setVapidDetails(
  'mailto:admin@siddhamwellness.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

let _redis: Redis | null = null;
function getRedis(): Redis | null {
  if (_redis) return _redis;
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  _redis = new Redis({ url, token });
  return _redis;
}

export async function sendAdminPushNotification(title: string, body: string, url: string = '/admin') {
  try {
    const subscriptions = await prisma.adminPushSubscription.findMany();
    const payload = JSON.stringify({ title, body, url });
    
    const promises = subscriptions.map(sub => 
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, 
        payload
      ).catch(async e => {
        const r = getRedis();
        if (r) await r.lpush("push_debug_logs", JSON.stringify({ error: e.message, code: e.statusCode, time: Date.now() }));
        if (e.statusCode === 410 || e.statusCode === 404) {
          return prisma.adminPushSubscription.delete({ where: { id: sub.id } });
        }
      })
    );
    await Promise.all(promises);
  } catch (error: any) {
    console.error('Push error:', error);
    const r = getRedis();
    if (r) await r.lpush("push_debug_logs", JSON.stringify({ error: error?.message || 'unknown', type: 'outer', time: Date.now() }));
  }
}
