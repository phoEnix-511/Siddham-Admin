import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    requireSuperAdmin(req);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data } = req.body;
  
  if (!data || !data.categories) {
    return res.status(400).json({ error: 'Invalid backup format' });
  }

  try {
    // 1. Force a current backup to disk before wiping
    console.log('[restore] Taking forced local backup...');
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const currentData = {
      categories: await prisma.category.findMany(),
      products: await prisma.product.findMany(),
      settings: await prisma.setting.findMany(),
      adminUsers: await prisma.adminUser.findMany(),
      customers: await prisma.customer.findMany(),
      orders: await prisma.order.findMany(),
      orderItems: await prisma.orderItem.findMany(),
      addresses: await prisma.address.findMany(),
      accounts: await prisma.account.findMany(),
      sessions: await prisma.session.findMany(),
      reviews: await prisma.review.findMany(),
      productVariants: await prisma.productVariant.findMany(),
      rewardTransactions: await prisma.rewardTransaction.findMany(),
      bundleOffers: await prisma.bundleOffer.findMany()
    };
    
    const backupPath = path.join(backupDir, `auto-backup-before-restore-${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify({ version: '1.0', timestamp: new Date().toISOString(), data: currentData }, null, 2));
    console.log('[restore] Backup saved to', backupPath);

    // 2. Execute Wipe and Restore
    await prisma.$transaction(async (tx) => {
      // Wipe tables in reverse dependency order
      await tx.orderItem.deleteMany();
      await tx.order.deleteMany();
      await tx.review.deleteMany();
      await tx.productVariant.deleteMany();
      await tx.product.deleteMany();
      await tx.category.deleteMany();
      
      await tx.address.deleteMany();
      await tx.account.deleteMany();
      await tx.session.deleteMany();
      await tx.rewardTransaction.deleteMany();
      await tx.customer.deleteMany();
      
      await tx.adminUser.deleteMany();
      await tx.setting.deleteMany();
      await tx.bundleOffer.deleteMany();

      // Insert data in dependency order
      if (data.adminUsers?.length) await tx.adminUser.createMany({ data: data.adminUsers });
      if (data.settings?.length) await tx.setting.createMany({ data: data.settings });
      if (data.bundleOffers?.length) await tx.bundleOffer.createMany({ data: data.bundleOffers });
      
      if (data.categories?.length) await tx.category.createMany({ data: data.categories });
      if (data.products?.length) await tx.product.createMany({ data: data.products });
      if (data.productVariants?.length) await tx.productVariant.createMany({ data: data.productVariants });
      if (data.reviews?.length) await tx.review.createMany({ data: data.reviews });
      
      if (data.customers?.length) await tx.customer.createMany({ data: data.customers });
      if (data.addresses?.length) await tx.address.createMany({ data: data.addresses });
      if (data.accounts?.length) await tx.account.createMany({ data: data.accounts });
      if (data.sessions?.length) await tx.session.createMany({ data: data.sessions });
      if (data.rewardTransactions?.length) await tx.rewardTransaction.createMany({ data: data.rewardTransactions });
      
      if (data.orders?.length) await tx.order.createMany({ data: data.orders });
      if (data.orderItems?.length) await tx.orderItem.createMany({ data: data.orderItems });
    });

    return res.status(200).json({ success: true, message: 'Database restored successfully' });
  } catch (error: any) {
    console.error('[restore] Restore failed:', error);
    return res.status(500).json({ error: 'Restore failed: ' + error.message });
  }
}
