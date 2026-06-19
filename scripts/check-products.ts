import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } }
    });
    console.log('Categories & counts in DB:');
    categories.forEach(c => {
      console.log(`- ${c.name} (slug: ${c.slug}): count ${c._count.products}`);
    });

    const products = await prisma.product.findMany({
      include: { category: true }
    });
    console.log('\nAll Products in DB:');
    products.forEach(p => {
      console.log(`- ${p.name} (category: ${p.category.name}, slug: ${p.slug}, isActive: ${p.isActive})`);
    });
  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await pool.end();
  }
}

main();
