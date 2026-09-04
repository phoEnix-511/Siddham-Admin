import webpush from 'web-push';
import { prisma } from './prisma';

webpush.setVapidDetails(
  'mailto:admin@siddhamwellness.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

export async function sendAdminPushNotification(title: string, body: string, url: string = '/admin') {
  try {
    const subscriptions = await prisma.adminPushSubscription.findMany();
    const payload = JSON.stringify({ title, body, url });
    
    const promises = subscriptions.map(sub => 
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, 
        payload
      ).catch(e => {
        if (e.statusCode === 410 || e.statusCode === 404) {
          return prisma.adminPushSubscription.delete({ where: { id: sub.id } });
        }
      })
    );
    await Promise.all(promises);
  } catch (error) {
    console.error('Push error:', error);
  }
}
