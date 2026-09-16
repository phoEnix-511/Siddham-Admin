import webpush from 'web-push';
import { prisma } from './prisma';
import { Redis } from '@upstash/redis';

let _vapidConfigured = false;
function ensureVapid() {
  if (_vapidConfigured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) {
    console.warn('[push] VAPID keys not configured in environment variables');
    return false;
  }
  try {
    webpush.setVapidDetails('mailto:admin@siddhamwellness.com', pub, priv);
    _vapidConfigured = true;
    return true;
  } catch (err) {
    console.error('[push] Invalid VAPID configuration:', err);
    return false;
  }
}

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
    if (!ensureVapid()) {
      const r = getRedis();
      if (r) await r.lpush("push_debug_logs", JSON.stringify({ error: "VAPID keys missing at runtime", time: Date.now() }));
      return;
    }
    const subscriptions = await prisma.adminPushSubscription.findMany();
    const r = getRedis();
    if (r) await r.lpush("push_debug_logs", JSON.stringify({ event: "sendAdminPushNotification", subsFound: subscriptions.length, title, time: Date.now() }));
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
