const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const subs = await prisma.adminPushSubscription.count();
  console.log('Subscriptions:', subs);
}
run();
