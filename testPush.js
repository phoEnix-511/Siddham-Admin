const webpush = require('web-push');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

webpush.setVapidDetails(
  'mailto:admin@siddhamwellness.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

async function testPush() {
  try {
    const subscriptions = await prisma.adminPushSubscription.findMany();
    console.log('Found subscriptions:', subscriptions.length);
    
    if (subscriptions.length === 0) {
      console.log('No subscriptions found. Please click Enable Push in the UI first.');
      return;
    }

    const payload = JSON.stringify({ title: 'Test Push', body: 'This is a test notification.', url: '/admin' });
    
    for (const sub of subscriptions) {
      console.log('Sending to:', sub.endpoint);
      try {
        const res = await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, 
          payload
        );
        console.log('Success!', res.statusCode);
      } catch (e) {
        console.error('Failed to send:', e.statusCode, e.body);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPush();
