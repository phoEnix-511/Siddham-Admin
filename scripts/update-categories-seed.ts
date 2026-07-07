/**
 * update-categories-seed.ts
 * Seeding concerns and navigation categories safely.
 */
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env') });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('🌱 Updating categories and concerns...');

  const categories = [
    // Shop by Concern List
    { name: "Brain wellness", slug: "brain-wellness", description: "Improve focus, memory, and cognitive balance" },
    { name: "Cardiac wellness", slug: "cardiac-wellness", description: "Healthy heart function and circulation" },
    { name: "Daily wellness", slug: "daily-wellness", description: "Vitamins, energy, and general wellbeing" },
    { name: "Diabetic wellness", slug: "diabetic-wellness", description: "Natural sugar management and metabolic care" },
    { name: "Digestive wellness", slug: "digestive-wellness", description: "Acidity, bloating, gas, and stomach relief" },
    { name: "Hair wellness", slug: "hair-wellness", description: "Control hair fall, promote hair growth" },
    { name: "Immunity wellness", slug: "immunity-wellness", description: "Strenthen natural defense system against pathogens" },
    { name: "Kidney wellness", slug: "kidney-wellness", description: "Renal care, detox, and stone prevention" },
    { name: "liver wellness", slug: "liver-wellness", description: "Detoxify liver, fatty liver relief" },
    { name: "men's wellness", slug: "mens-wellness", description: "Strength, energy, and male vitality" },
    { name: "Pain reliever", slug: "pain-reliever", description: "Joint pains, backaches, and muscle relief" },
    { name: "Skin wellness", slug: "skin-wellness", description: "Glowing skin, anti-acne, and pure complexion" },
    { name: "Stamina Booster", slug: "stamina-booster", description: "Energy booster, physical stamina enhancer" },
    { name: "Women's wellness", slug: "womens-wellness", description: "Hormonal balance and female reproductive wellness" },
    { name: "Blood purify", slug: "blood-purify", description: "Cleanse blood toxins and skin problems" },

    // Navbar Top Categories
    { name: "Single herb powders", slug: "single-herb-powders", description: "Pure herb powders from organic farms" },
    { name: "Single herb tablets", slug: "single-herb-tablets", description: "Pure organic single herb tablets" },
    { name: "Hair Care", slug: "hair-care", description: "Natural hair care cleansers and oils" },
    { name: "Skin Care", slug: "skin-care", description: "Ayurvedic skin care products" },
    { name: "Combos", slug: "combos", description: "Value bundles and combination cures" }
  ];

  for (const cat of categories) {
    const c = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description },
      create: cat,
    });
    console.log(`✅ Category/Concern: ${c.name} (${c.slug})`);
  }

  // Update free shipping threshold to 499 in Settings
  await prisma.setting.upsert({
    where: { key: 'free_shipping_threshold' },
    update: { value: '499' },
    create: { key: 'free_shipping_threshold', value: '499', group: 'shipping' }
  });
  console.log('✅ Setting free_shipping_threshold set to 499');

  await pool.end();
  console.log('🎉 Category/Concern Seeding Completed!');
}

main().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
