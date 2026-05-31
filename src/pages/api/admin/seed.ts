import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

// This route seeds the initial admin user and product data
// Run once: POST /api/admin/seed
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Create admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@siddhamwellness.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const adminName = process.env.ADMIN_NAME || 'Siddham Admin';

    const existingAdmin = await prisma.adminUser.findUnique({ where: { email: adminEmail } });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      await prisma.adminUser.create({
        data: { email: adminEmail, password: hashedPassword, name: adminName, role: 'admin' },
      });
    }

    // Create categories
    const categoryData = [
      { name: 'Hair Care', slug: 'hair-care', description: 'Natural Ayurvedic hair care products', imageUrl: '/images/categories/hair-care.jpg' },
      { name: 'Supplements', slug: 'supplements', description: 'Ayurvedic health supplements and tonics', imageUrl: '/images/categories/supplements.jpg' },
      { name: 'Skin Care', slug: 'skin-care', description: 'Natural skincare with herbal ingredients', imageUrl: '/images/categories/skin-care.jpg' },
      { name: 'Oils & Essentials', slug: 'oils-essentials', description: 'Pure Ayurvedic oils and essential blends', imageUrl: '/images/categories/oils.jpg' },
    ];

    const categories: Record<string, string> = {};
    for (const cat of categoryData) {
      const existing = await prisma.category.findUnique({ where: { slug: cat.slug } });
      if (!existing) {
        const created = await prisma.category.create({ data: cat });
        categories[cat.slug] = created.id;
      } else {
        categories[cat.slug] = existing.id;
      }
    }

    // Create products
    const products = [
      {
        name: 'Brahmi Amla Shampoo',
        slug: 'brahmi-amla-shampoo',
        description: 'A revitalizing Ayurvedic shampoo enriched with Brahmi, Amla, and Bhringraj extracts. Strengthens hair roots, reduces hair fall, and promotes lustrous growth.',
        price: 349,
        comparePrice: 450,
        stock: 120,
        sku: 'SW-SHAMP-001',
        isFeatured: true,
        ingredients: 'Brahmi (Bacopa monnieri), Amla (Indian Gooseberry), Bhringraj, Shikakai, Reetha, Neem',
        benefits: 'Reduces hair fall, Strengthens hair roots, Adds natural shine, Prevents dandruff',
        usage: 'Apply to wet hair, lather gently, leave for 2-3 minutes, rinse thoroughly. Use 2-3 times a week.',
        weight: '200ml',
        images: ['/images/products/brahmi-amla-shampoo.jpg'],
        categorySlug: 'hair-care',
      },
      {
        name: 'Neem Tulsi Anti-Dandruff Shampoo',
        slug: 'neem-tulsi-anti-dandruff-shampoo',
        description: 'Powerful anti-dandruff shampoo infused with Neem and Tulsi extracts that fight scalp infections and eliminate flakes naturally.',
        price: 329,
        comparePrice: 420,
        stock: 85,
        sku: 'SW-SHAMP-002',
        isFeatured: false,
        ingredients: 'Neem (Azadirachta indica), Tulsi (Holy Basil), Tea Tree Oil, Aloe Vera, Kalonji',
        benefits: 'Eliminates dandruff, Soothes scalp, Anti-bacterial, Anti-fungal',
        usage: 'Apply to wet scalp, massage gently for 3 minutes, rinse well. Use 3 times a week for best results.',
        weight: '200ml',
        images: ['/images/products/neem-tulsi-shampoo.jpg'],
        categorySlug: 'hair-care',
      },
      {
        name: 'Ashwagandha Vitality Capsules',
        slug: 'ashwagandha-vitality-capsules',
        description: 'Premium KSM-66 Ashwagandha root extract capsules for stress relief, enhanced energy, and improved cognitive function. 500mg per capsule.',
        price: 699,
        comparePrice: 899,
        stock: 200,
        sku: 'SW-SUPP-001',
        isFeatured: true,
        ingredients: 'KSM-66 Ashwagandha Root Extract (500mg), Black Pepper (Piperine)',
        benefits: 'Reduces stress & anxiety, Boosts energy, Improves sleep quality, Enhances cognitive function',
        usage: 'Take 1 capsule twice daily with warm milk or water after meals.',
        weight: '60 Capsules',
        images: ['/images/products/ashwagandha-capsules.jpg'],
        categorySlug: 'supplements',
      },
      {
        name: 'Triphala Digestive Wellness',
        slug: 'triphala-digestive-wellness',
        description: 'Traditional Triphala formulation with Amla, Haritaki, and Bibhitaki for complete digestive health and gentle daily detox.',
        price: 449,
        comparePrice: 549,
        stock: 150,
        sku: 'SW-SUPP-002',
        isFeatured: false,
        ingredients: 'Amla (Emblica officinalis), Haritaki (Terminalia chebula), Bibhitaki (Terminalia bellirica)',
        benefits: 'Improves digestion, Gentle detox, Boosts immunity, Rich in Vitamin C',
        usage: 'Take 2 capsules at night before bed with warm water.',
        weight: '60 Capsules',
        images: ['/images/products/triphala-capsules.jpg'],
        categorySlug: 'supplements',
      },
      {
        name: 'Kumkumadi Brightening Face Oil',
        slug: 'kumkumadi-brightening-face-oil',
        description: 'Royal Kumkumadi oil with 16 rare herbs including Saffron and Sandalwood. Brightens skin, reduces dark spots, and provides deep nourishment.',
        price: 899,
        comparePrice: 1200,
        stock: 60,
        sku: 'SW-SKIN-001',
        isFeatured: true,
        ingredients: 'Saffron (Kesar), Sandalwood, Manjistha, Vetiver, Lodhra, Sesame Oil base',
        benefits: 'Brightens skin, Reduces dark spots, Anti-aging, Deep nourishment',
        usage: 'Apply 3-4 drops on clean face at night. Massage gently in upward circular motion.',
        weight: '15ml',
        images: ['/images/products/kumkumadi-oil.jpg'],
        categorySlug: 'skin-care',
      },
      {
        name: 'Bhringraj Hair Growth Oil',
        slug: 'bhringraj-hair-growth-oil',
        description: 'Classic Bhringraj oil with Amla, Brahmi, and Hibiscus for accelerated hair growth, reduced greying, and scalp nourishment.',
        price: 399,
        comparePrice: 499,
        stock: 8,
        sku: 'SW-OIL-001',
        isFeatured: false,
        ingredients: 'Bhringraj, Amla, Brahmi, Hibiscus, Coconut Oil base, Sesame Oil',
        benefits: 'Accelerates hair growth, Reduces premature greying, Strengthens hair, Nourishes scalp',
        usage: 'Warm slightly, apply to scalp and hair. Massage for 10 minutes. Leave for 1 hour or overnight. Wash with Ayurvedic shampoo.',
        weight: '100ml',
        images: ['/images/products/bhringraj-oil.jpg'],
        categorySlug: 'oils-essentials',
      },
    ];

    for (const prod of products) {
      const existing = await prisma.product.findUnique({ where: { slug: prod.slug } });
      if (!existing) {
        const { categorySlug, ...rest } = prod;
        await prisma.product.create({
          data: {
            ...rest,
            isActive: true,
            categoryId: categories[categorySlug],
          },
        });
      }
    }

    // Create default settings
    const defaultSettings = [
      { key: 'razorpay_key_id', value: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '', group: 'payment' },
      { key: 'razorpay_key_secret', value: process.env.RAZORPAY_KEY_SECRET || '', group: 'payment' },
      { key: 'store_name', value: 'Siddham Wellness', group: 'general' },
      { key: 'store_email', value: 'hello@siddhamwellness.com', group: 'general' },
      { key: 'store_phone', value: '+91 98765 43210', group: 'general' },
      { key: 'free_shipping_threshold', value: '999', group: 'shipping' },
      { key: 'shipping_charge', value: '99', group: 'shipping' },
      { key: 'low_stock_threshold', value: '10', group: 'inventory' },
    ];

    for (const s of defaultSettings) {
      await prisma.setting.upsert({ where: { key: s.key }, update: {}, create: s });
    }

    return res.status(200).json({ success: true, message: 'Database seeded successfully' });
  } catch (error) {
    console.error('Seed error:', error);
    return res.status(500).json({ error: 'Seed failed', details: String(error) });
  }
}
