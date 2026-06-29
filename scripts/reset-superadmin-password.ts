import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.adminUser.upsert({
      where: { email: 'admin@siddhamwellness.com' },
      update: { password: hashedPassword, role: 'super_admin' },
      create: {
        email: 'admin@siddhamwellness.com',
        name: 'Super Admin',
        role: 'super_admin',
        password: hashedPassword,
      },
    });
    console.log('Successfully reset super_admin password to: admin123');
  } catch (error) {
    console.error('Failed to reset password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
