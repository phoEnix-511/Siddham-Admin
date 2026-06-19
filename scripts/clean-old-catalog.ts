import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL environment variable is missing.');
    process.exit(1);
  }

  console.log('🌱 Connecting to database to clean old catalog...');
  const pool = new pg.Pool({ connectionString: dbUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // Slugs of the new catalog products
    const newSlugs = [
      "liver-sanjeevani",
      "piles-cure",
      "digesto-prash",
      "forest-sulfate-free-shampoo",
      "ashwagandha",
      "shatavari",
      "giloy",
      "shilajeet",
      "arjuna",
      "gokshura"
    ];

    // Find and delete products that are not part of the new catalog
    const oldProducts = await prisma.product.findMany({
      where: {
        slug: {
          notIn: newSlugs
        }
      }
    });

    console.log(`Found ${oldProducts.length} old products to delete.`);

    for (const prod of oldProducts) {
      // Check if product is in any order
      const orderCount = await prisma.orderItem.count({
        where: { productId: prod.id }
      });

      if (orderCount > 0) {
        // If it is in an order, soft-delete it by marking it inactive instead of crashing
        await prisma.product.update({
          where: { id: prod.id },
          data: { isActive: false }
        });
        console.log(`⚠️ Product "${prod.name}" has order history. Soft-deleted (marked inactive) instead of hard-delete.`);
      } else {
        // Safe to hard delete
        await prisma.product.delete({
          where: { id: prod.id }
        });
        console.log(`✅ Deleted product: "${prod.name}"`);
      }
    }

    // Clean up empty categories (categories that have 0 products associated with them)
    const categories = await prisma.category.findMany({
      include: {
        products: true
      }
    });

    let deletedCategoriesCount = 0;
    for (const cat of categories) {
      if (cat.products.length === 0) {
        await prisma.category.delete({
          where: { id: cat.id }
        });
        console.log(`✅ Deleted empty category: "${cat.name}"`);
        deletedCategoriesCount++;
      }
    }

    console.log(`\n🎉 Catalog cleanup complete! Deleted ${deletedCategoriesCount} categories.`);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
