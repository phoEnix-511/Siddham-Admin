/**
 * Siddham Wellness – Database Seed Script
 * Run via: npx tsx prisma/seed.ts
 * OR it's called automatically by the /api/admin/seed endpoint from the UI.
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
    { name: 'Hair Care', slug: 'hair-care', description: 'Ayurvedic shampoos, oils, and treatments for healthy hair' },
    { name: 'Supplements', slug: 'supplements', description: 'Herbal capsules and powders for inner wellness' },
    { name: 'Skin Care', slug: 'skin-care', description: 'Natural skincare products rooted in Ayurveda' },
    { name: 'Oils & Essentials', slug: 'oils-essentials', description: 'Pure Ayurvedic oils and essential care products' },
  ];

  const createdCategories: Record<string, string> = {};
  for (const cat of categories) {
    const c = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    createdCategories[cat.slug] = c.id;
    console.log(`✅ Category: ${cat.name}`);
  }

  // ── Products ─────────────────────────────────────────────────
  const products = [
    {
      name: 'Brahmi Amla Shampoo',
      slug: 'brahmi-amla-shampoo',
      description: 'A gentle, sulfate-free shampoo infused with Brahmi and Amla extracts. Reduces hair fall, strengthens roots, and adds deep shine without stripping natural oils.',
      price: 349,
      comparePrice: 499,
      stock: 150,
      sku: 'SW-HAIR-001',
      isActive: true,
      isFeatured: true,
      categorySlug: 'hair-care',
      ingredients: 'Brahmi (Bacopa monnieri) extract, Amla (Phyllanthus emblica) extract, Bhringraj oil, Neem extract, Reetha (soapnut) saponins, Aloe vera gel',
      benefits: 'Reduces hair fall, Strengthens hair roots, Adds natural shine, Nourishes scalp, Sulfate-free formula',
      usage: 'Apply to wet hair, massage gently for 2-3 minutes. Rinse thoroughly. Use 2-3 times per week for best results.',
      weight: '200ml',
    },
    {
      name: 'Bhringraj Hair Oil',
      slug: 'bhringraj-hair-oil',
      description: 'Cold-pressed Bhringraj oil blended with Sesame, Coconut, and Amla in a traditional Ayurvedic formulation. Promotes hair growth and prevents premature greying.',
      price: 449,
      comparePrice: 599,
      stock: 120,
      sku: 'SW-HAIR-002',
      isActive: true,
      isFeatured: true,
      categorySlug: 'hair-care',
      ingredients: 'Bhringraj (Eclipta prostrata) extract, Sesame oil (base), Cold-pressed Coconut oil, Amla oil, Brahmi extract, Hibiscus extract',
      benefits: 'Promotes hair growth, Prevents premature greying, Reduces dandruff, Deep nourishment, Improves scalp circulation',
      usage: 'Warm the oil slightly. Massage into scalp with fingertips for 10-15 minutes. Leave for at least 1 hour or overnight. Wash off with Brahmi Amla Shampoo.',
      weight: '100ml',
    },
    {
      name: 'Ashwagandha Root Capsules',
      slug: 'ashwagandha-root-capsules',
      description: 'Premium Ashwagandha (Withania somnifera) root extract capsules standardized to 5% withanolides. Helps reduce stress, improve sleep quality, and boost vitality.',
      price: 699,
      comparePrice: 899,
      stock: 200,
      sku: 'SW-SUPP-001',
      isActive: true,
      isFeatured: true,
      categorySlug: 'supplements',
      ingredients: 'Ashwagandha root extract (500mg per capsule, standardized to 5% withanolides), Vegetable capsule shell',
      benefits: 'Reduces cortisol and stress, Improves sleep quality, Boosts energy and stamina, Supports immune function, Enhances cognitive function',
      usage: 'Take 1-2 capsules daily with warm milk or water, preferably before bedtime. Consistent use for 4-8 weeks recommended for optimal results.',
      weight: '60 Capsules',
    },
    {
      name: 'Triphala Churna',
      slug: 'triphala-churna',
      description: 'The time-honored Ayurvedic formula combining three superfruits — Amalaki, Bibhitaki, and Haritaki. Supports healthy digestion, gentle detox, and overall wellbeing.',
      price: 299,
      comparePrice: null,
      stock: 180,
      sku: 'SW-SUPP-002',
      isActive: true,
      isFeatured: false,
      categorySlug: 'supplements',
      ingredients: 'Amalaki (Emblica officinalis) 33%, Bibhitaki (Terminalia bellerica) 33%, Haritaki (Terminalia chebula) 34%',
      benefits: 'Supports healthy digestion, Natural gentle detox, Rich in Vitamin C and antioxidants, Supports healthy gut flora, Mild laxative effect',
      usage: 'Mix 1/2 to 1 teaspoon in warm water. Drink before bedtime. Start with a smaller dose and increase gradually.',
      weight: '150g Powder',
    },
    {
      name: 'Kumkumadi Face Oil',
      slug: 'kumkumadi-face-oil',
      description: 'The legendary Kumkumadi Tailam — a luxurious Ayurvedic facial oil made with saffron, turmeric, and over 16 precious herbs. Brightens skin, fades blemishes, and restores radiance.',
      price: 1299,
      comparePrice: 1799,
      stock: 60,
      sku: 'SW-SKIN-001',
      isActive: true,
      isFeatured: true,
      categorySlug: 'skin-care',
      ingredients: 'Kumkuma (Saffron), Turmeric, Sandalwood, Vetiver, Red Sandalwood, Lotus, Manjistha, Licorice, Sesame oil base',
      benefits: 'Brightens skin tone, Fades dark spots and blemishes, Anti-aging properties, Deep hydration, Improves skin texture',
      usage: 'Take 2-3 drops and warm between palms. Gently press into cleansed face and neck. Use nightly for best results. A little goes a long way.',
      weight: '30ml',
    },
    {
      name: 'Neem Tulsi Face Wash',
      slug: 'neem-tulsi-face-wash',
      description: 'A refreshing natural face wash with the antibacterial power of Neem and the purifying properties of Tulsi. Controls excess oil, prevents breakouts, and keeps skin clean.',
      price: 249,
      comparePrice: 349,
      stock: 220,
      sku: 'SW-SKIN-002',
      isActive: true,
      isFeatured: false,
      categorySlug: 'skin-care',
      ingredients: 'Neem (Azadirachta indica) extract, Tulsi (Ocimum sanctum) extract, Aloe vera gel, Tea tree essential oil, Glycerin',
      benefits: 'Controls excess oil, Prevents acne and breakouts, Antibacterial properties, Deep pore cleansing, Suitable for oily and combination skin',
      usage: 'Wet face with water. Apply a small amount, massage gently in circular motions. Rinse thoroughly. Use twice daily.',
      weight: '100ml',
    },
    {
      name: 'Mahanarayan Massage Oil',
      slug: 'mahanarayan-massage-oil',
      description: 'The classical Ayurvedic Mahanarayan Taila — formulated with over 50 herbs in a sesame oil base. Used traditionally for joint and muscle discomfort, promoting flexibility and mobility.',
      price: 549,
      comparePrice: 699,
      stock: 85,
      sku: 'SW-OIL-001',
      isActive: true,
      isFeatured: false,
      categorySlug: 'oils-essentials',
      ingredients: 'Ashwagandha, Shatavari, Bala, Bilva, Devadaru, 45+ Ayurvedic herbs, Sesame oil base, Milk',
      benefits: 'Relieves joint and muscle pain, Improves flexibility, Reduces inflammation, Promotes circulation, Supports Vata balance',
      usage: 'Warm the oil. Massage into affected joints or muscles using firm circular motions. Leave for 30-60 minutes before bathing. Use 2-3 times weekly.',
      weight: '200ml',
    },
    {
      name: 'Shatavari Churna',
      slug: 'shatavari-churna',
      description: 'Pure Shatavari (Asparagus racemosus) root powder — the revered Ayurvedic herb for women\'s wellness. Supports hormonal balance, reproductive health, and vitality.',
      price: 399,
      comparePrice: 499,
      stock: 140,
      sku: 'SW-SUPP-003',
      isActive: true,
      isFeatured: true,
      categorySlug: 'supplements',
      ingredients: 'Shatavari (Asparagus racemosus) root powder, 100% pure and natural',
      benefits: 'Supports hormonal balance, Promotes reproductive health, Enhances vitality and energy, Rich in natural phytoestrogens, Supports lactation',
      usage: 'Mix 1 teaspoon in warm milk with a little honey. Take once or twice daily. Best taken on an empty stomach in the morning.',
      weight: '200g Powder',
    },
  ];

  for (const p of products) {
    const { categorySlug, ...productData } = p;
    const categoryId = createdCategories[categorySlug];
    if (!categoryId) continue;

    await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {},
      create: {
        ...productData,
        comparePrice: productData.comparePrice ?? undefined,
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
    { key: 'store_phone', value: '+91 98765 43210', group: 'store' },
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
