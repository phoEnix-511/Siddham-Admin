import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  try {
    const admin = await prisma.adminUser.upsert({
      where: { email: 'admin@siddhamwellness.com' },
      update: { role: 'super_admin' },
      create: {
        email: 'admin@siddhamwellness.com',
        name: 'Super Admin',
        role: 'super_admin',
        password: '$2a$12$sK1R2T0V1G2e/gQ5mS1d8uM7B1sD7.M9p.mP1zH9G6M3Q4nO6Z7F.', // hash for 'password' if created fresh
      },
    });
    console.log('Successfully upgraded super_admin:', admin.email);
  } catch (error) {
    console.error('Failed to upgrade:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
