/**
 * Siddham Wellness – Database Seed Script
 * Run via: npx tsx prisma/seed.ts
 */
import { config } from 'dotenv';
import { resolve } from 'path';
// Load .env from project root
config({ path: resolve(process.cwd(), '.env') });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('🌱 Seeding Siddham Wellness database...');

  // ── Clear Database ──────────────────────────────────────────
  console.log('🧹 Clearing existing database records...');
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  console.log('✅ Database cleared.');

  // ── Admin User ──────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@siddhamwellness.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const adminName = process.env.ADMIN_NAME || 'Siddham Admin';

  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, password: hashedPassword, name: adminName },
  });
  console.log(`✅ Admin user created: ${adminEmail}`);

  // ── Categories ──────────────────────────────────────────────
  const categories = [
    { name: 'Ayurvedic Herbal Formulation', slug: 'ayurvedic-herbal-formulation', description: 'Tonics and liquid formulations for targeted health goals' },
    { name: 'Ayurvedic Proprietary Medicine', slug: 'ayurvedic-proprietary-medicine', description: 'Classical and proprietary Ayurvedic tablets and remedies' },
    { name: 'Ayurvedic Formulation', slug: 'ayurvedic-formulation', description: 'Prash, churnas, and traditional herbal mixtures' },
    { name: 'Hair Care', slug: 'hair-care', description: 'Natural Ayurvedic hair cleansers, oils and treatments' },
  ];

  const createdCategories: Record<string, string> = {};
  for (const cat of categories) {
    const c = await prisma.category.create({
      data: cat,
    });
    createdCategories[cat.slug] = c.id;
    console.log(`✅ Category: ${cat.name}`);
  }

  // ── Products ─────────────────────────────────────────────────
  const products = [
    {
      name: "Liver Sanjeevani",
      slug: "liver-sanjeevani",
      description: "Your Daily Liver Care Tonic. A powerful and advanced Ayurvedic formulation for complete liver & digestive wellness.",
      price: 299,
      comparePrice: 399,
      stock: 150,
      sku: "SW-LIVER-001",
      weight: "200 ml",
      ingredients: "Giloy, Punarnava, Kalmegh, Bhumi Amla, Nagarmotha, Indrayan Jad (Indian Gentian Root)",
      benefits: "Liver Detoxification, Effective for Fatty Liver, Improves Overall Liver Functioning, Complete Digestive Care, Relieves Acidity & Hyperacidity, Promotes Healthy Digestion & Metabolism",
      usage: "10-15 ml twice daily after meals or as directed by a physician.",
      isActive: true,
      isFeatured: true,
      categorySlug: "ayurvedic-herbal-formulation",
    },
    {
      name: "Piles Cure",
      slug: "piles-cure",
      description: "Your natural relief for piles. A natural and effective Ayurvedic formulation for bleeding and non-bleeding piles.",
      price: 349,
      comparePrice: 449,
      stock: 100,
      sku: "SW-PILES-001",
      weight: "200 ml",
      ingredients: "Mahuwa, Munakka, Nagkesar, Harad, Kalimirch, Sonth, Vayvidang",
      benefits: "Helps in Bleeding & Non-Bleeding Piles, Relief in External & Internal Piles, Helps in Anal Fissures, Relief in Inflammatory Conditions of Rectum, Relieves Constipation & Improves Bowel Movement, Improves Blood Circulation & Strengthens Veins",
      usage: "10-15 ml twice a day after meals or as directed by the physician.",
      isActive: true,
      isFeatured: true,
      categorySlug: "ayurvedic-proprietary-medicine",
    },
    {
      name: "Digesto Prash",
      slug: "digesto-prash",
      description: "Ayurvedic Solution for Complete Gut Wellness. Helps improve digestive health, reduce acidity and constipation, relieve gas and excessive body heat.",
      price: 499,
      comparePrice: 649,
      stock: 120,
      sku: "SW-DIGEST-001",
      weight: "150 GM",
      ingredients: "Triphala, Khajur (Dates), Munakka (Raisins), Mulethi (Licorice), Lendi Pipal, Prawal Pishti, Jaiphal, Saunf, Elaichi, Dalchini, Nagkesar, Vidhara, Amla",
      benefits: "Improves digestion & nutrient absorption, Relieves constipation & regulates bowel movements, Reduces acidity & soothes the stomach lining, Relieves gas, bloating & heaviness, Detoxifies & cleanses the gut naturally, Supports immunity and overall well-being",
      usage: "1-2 teaspoons (5-10 g) with lukewarm water or milk 1-2 times daily or as directed by the physician.",
      isActive: true,
      isFeatured: true,
      categorySlug: "ayurvedic-formulation",
    },
    {
      name: "Forest Sulfate Free Shampoo",
      slug: "forest-sulfate-free-shampoo",
      description: "Inspired by Traditional Ayurvedic Hair Care. Gently cleanses the scalp and hair, deeply nourishes, and makes hair stronger, shinier and healthier naturally.",
      price: 399,
      comparePrice: 549,
      stock: 150,
      sku: "SW-SHAMP-001",
      weight: "200 ML",
      ingredients: "Reetha, Shikakai, Amla, Bhringraj, Aloevera, Henna",
      benefits: "Gently cleanses scalp & hair without stripping natural oils, Retains natural moisture and hydration, Reduces hair breakage, hair fall & split ends, Helps relieve scalp irritation, dandruff & itchiness, Leaves hair soft, shiny and easy to manage",
      usage: "Wet your hair. Take a small amount & gently massage. Rinse thoroughly.",
      isActive: true,
      isFeatured: true,
      categorySlug: "hair-care",
    },
    {
      name: "Ashwagandha",
      slug: "ashwagandha",
      description: "Relieves stress & boosts strength. Made with organic Ashwagandha root extract.",
      price: 299,
      comparePrice: 399,
      stock: 200,
      sku: "SW-ASHWA-001",
      weight: "60 Tablets",
      ingredients: "Organic Ashwagandha Root extract",
      benefits: "Helps reduce stress & anxiety, Supports strength, stamina & endurance, Promotes better sleep quality, Supports brain function & focus, Supports overall vitality & well-being",
      usage: "1 tablet twice a day with milk / water or as advised by physician.",
      isActive: true,
      isFeatured: true,
      categorySlug: "ayurvedic-proprietary-medicine",
    },
    {
      name: "Shatavari",
      slug: "shatavari",
      description: "Supports women's hormonal balance. Made with organic Shatavari root extract.",
      price: 299,
      comparePrice: 399,
      stock: 180,
      sku: "SW-SHATA-001",
      weight: "60 Tablets",
      ingredients: "Organic Shatavari Root extract",
      benefits: "Supports women's hormonal balance, Supports reproductive health, Helps improve lactation, Nourishes & supports overall vitality, Promotes inner balance & well-being",
      usage: "1 tablet twice a day with milk / water or as advised by physician.",
      isActive: true,
      isFeatured: false,
      categorySlug: "ayurvedic-proprietary-medicine",
    },
    {
      name: "Giloy",
      slug: "giloy",
      description: "Boosts immunity. Made with organic Giloy stem extract.",
      price: 249,
      comparePrice: 349,
      stock: 250,
      sku: "SW-GILOY-001",
      weight: "60 Tablets",
      ingredients: "Organic Giloy Stem extract",
      benefits: "Boosts immunity, Helps detoxify the body, Supports respiratory health, Helps manage fever & infections, Promotes overall health & wellness",
      usage: "1 tablet twice a day with milk / water or as advised by physician.",
      isActive: true,
      isFeatured: false,
      categorySlug: "ayurvedic-proprietary-medicine",
    },
    {
      name: "Shilajeet",
      slug: "shilajeet",
      description: "Boosts strength & stamina. Made with Himalayan Shilajeet extract.",
      price: 999,
      comparePrice: 1499,
      stock: 80,
      sku: "SW-SHILA-001",
      weight: "30 Tablets",
      ingredients: "Himalayan Shilajeet extract",
      benefits: "Improves strength, stamina & endurance, Enhances energy & reduces fatigue, Supports healthy aging & vitality, Improves testosterone levels & sexual health, Supports immune function & overall well-being",
      usage: "1 tablet twice a day with milk / water or as advised by physician.",
      isActive: true,
      isFeatured: true,
      categorySlug: "ayurvedic-proprietary-medicine",
    },
    {
      name: "Arjuna",
      slug: "arjuna",
      description: "Cardiac wellness. Made with organic Arjuna extract.",
      price: 249,
      comparePrice: 349,
      stock: 150,
      sku: "SW-ARJUN-001",
      weight: "30 Tablets",
      ingredients: "Organic Arjuna Extract",
      benefits: "Supports healthy heart function, Helps maintain normal blood pressure, Supports healthy blood circulation, Strengthens heart muscles & improves endurance, Supports overall cardiovascular health & well-being",
      usage: "1 tablet twice a day with milk / water or as advised by physician.",
      isActive: true,
      isFeatured: false,
      categorySlug: "ayurvedic-proprietary-medicine",
    },
    {
      name: "Gokshura",
      slug: "gokshura",
      description: "Improves vigour & vitality. Made with organic Gokshura extract.",
      price: 299,
      comparePrice: 399,
      stock: 150,
      sku: "SW-GOKSH-001",
      weight: "30 Tablets",
      ingredients: "Organic Gokshura Extract",
      benefits: "Improves strength, stamina & physical performance, Supports healthy kidney & urinary function, Helps balance hormones naturally, Enhances libido & reproductive health, Supports overall vitality & well-being",
      usage: "1 tablet twice a day with milk / water or as advised by physician.",
      isActive: true,
      isFeatured: true,
      categorySlug: "ayurvedic-proprietary-medicine",
    },
  ];

  for (const p of products) {
    const { categorySlug, ...productData } = p;
    const categoryId = createdCategories[categorySlug];
    if (!categoryId) continue;

    await prisma.product.create({
      data: {
        ...productData,
        images: [],
        categoryId,
      },
    });
    console.log(`✅ Product: ${productData.name}`);
  }

  // ── Default Settings ─────────────────────────────────────────
  const defaultSettings = [
    { key: 'store_name', value: 'Siddham Wellness', group: 'store' },
    { key: 'store_email', value: 'hello@siddhamwellness.com', group: 'store' },
    { key: 'store_phone', value: '+91 83198 77420', group: 'store' },
    { key: 'razorpay_key_id', value: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '', group: 'payment' },
    { key: 'razorpay_key_secret', value: process.env.RAZORPAY_KEY_SECRET || '', group: 'payment' },
    { key: 'free_shipping_threshold', value: '999', group: 'shipping' },
    { key: 'shipping_charge', value: '99', group: 'shipping' },
    { key: 'low_stock_threshold', value: '10', group: 'inventory' },
  ];

  for (const s of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log('✅ Default settings created');

  console.log('\n🎉 Seed complete! You can now log in at /admin/login');
  console.log(`   Email:    ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);

  await pool.end();
}

main().catch(e => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});
