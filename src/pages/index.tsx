import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';

interface Product {
  id: string;
  name: string;
  caption?: string;
  price: number;
  comparePrice?: number;
  images: string[];
  stock: number;
  isFeatured: boolean;
  category: { name: string; slug: string };
  description: string;
  variants?: Array<{
    id: string;
    name: string;
    price: number;
    stock: number;
  }>;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: { products: number };
}

const CATEGORY_ICONS: Record<string, string> = {
  'hair-care': '💆',
  'supplements': '💊',
  'skin-care': '✨',
  'oils-essentials': '🌿',
  'ayurvedic-herbal-formulation': '🍶',
  'ayurvedic-proprietary-medicine': '💊',
  'ayurvedic-formulation': '🍯',
};

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { addToast } = useToast();

  const discount = product.comparePrice
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : 0;

  const handleAdd = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0] || '',
      stock: product.stock,
    });
    addToast(`${product.name} added to cart`, 'success');
  };

  return (
    <div className="product-card">
      <Link href={`/products/${product.id}`}>
        <div className="product-card-image">
          {product.images && product.images.length > 0 && product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                const parent = (e.target as HTMLImageElement).parentElement;
                const fallback = parent?.querySelector('.fallback-placeholder');
                if (fallback) (fallback as HTMLElement).style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className="img-placeholder fallback-placeholder"
            style={{
              display: product.images && product.images.length > 0 && product.images[0] ? 'none' : 'flex'
            }}
          >
            {CATEGORY_ICONS[product.category.slug] || '🌿'}
          </div>
          {discount > 0 && <span className="product-card-badge">{discount}% OFF</span>}
          {product.stock <= 10 && product.stock > 0 && (
            <span className="product-card-badge" style={{ left: 'auto', right: 'var(--space-3)', background: 'var(--color-bark)' }}>
              Low Stock
            </span>
          )}
          <div className="product-card-actions">
            {product.variants && product.variants.length > 0 ? (
              <span className="btn btn-gold" style={{ width: '100%', borderRadius: 8, display: 'inline-flex', justifyContent: 'center' }}>
                🔍 View Options
              </span>
            ) : (
              <button
                className="btn btn-gold"
                style={{ width: '100%', borderRadius: 8 }}
                onClick={e => {
                  e.preventDefault();
                  handleAdd();
                }}
                disabled={product.stock === 0}
              >
                {product.stock === 0 ? 'Out of Stock' : '+ Add to Cart'}
              </button>
            )}
          </div>
        </div>
      </Link>
      <div className="product-card-body">
        <div className="product-category-tag">{product.category.name}</div>
        <Link href={`/products/${product.id}`}>
          <div className="product-name">{product.name}</div>
        </Link>
        {product.caption && (
          <div className="product-caption">{product.caption}</div>
        )}
        <div className="product-price">
          <span className="price-current">₹{product.price}</span>
          {product.comparePrice && <span className="price-compare">₹{product.comparePrice}</span>}
          {discount > 0 && <span className="price-discount">Save {discount}%</span>}
        </div>
        {product.stock === 0 && (
          <div style={{ fontSize: '0.75rem', color: 'var(--color-error)', marginTop: 'var(--space-2)', fontWeight: 600 }}>
            Out of Stock
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [hero, setHero] = useState({
    title: 'Heal Naturally. Live Wholly.',
    subtitle: "Discover our curated range of authentic Ayurvedic formulations, crafted from the finest herbs for your hair, skin, and inner wellbeing.",
    image: '',
  });

  useEffect(() => {
    fetch('/api/products?featured=true&limit=6')
      .then(r => r.json())
      .then(d => setFeaturedProducts(d.products || []));
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => setCategories(d.categories || []));
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        if (d.settings) {
          setHero({
            title: d.settings.hero_title || 'Heal Naturally. Live Wholly.',
            subtitle: d.settings.hero_subtitle || "Discover our curated range of authentic Ayurvedic formulations, crafted from the finest herbs for your hair, skin, and inner wellbeing.",
            image: d.settings.hero_image || '',
          });
        }
      })
      .catch(err => console.error('Error fetching settings for Home:', err));
  }, []);

  return (
    <>
      <Head>
        <title>Siddham Wellness – Ancient Wisdom, Modern Wellness</title>
        <meta name="description" content="Shop premium Ayurvedic products at Siddham Wellness. Herbal shampoos, supplements, skin care and more crafted from nature's finest ingredients." />
      </Head>

      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section 
        className="hero" 
        aria-label="Hero"
        style={hero.image ? { 
          backgroundImage: `linear-gradient(rgba(6, 26, 17, 0.75), rgba(6, 26, 17, 0.8)), url(${hero.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'var(--color-parchment)',
          position: 'relative'
        } : undefined}
      >
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-eyebrow">
              <span>🌿</span>
              <span style={hero.image ? { color: 'var(--color-saffron-light)' } : undefined}>Ayurveda · Since Ancient Times</span>
            </div>
            <h1 style={hero.image ? { color: 'var(--color-cream)' } : undefined}>{hero.title}</h1>
            <p className="hero-subtitle" style={hero.image ? { color: 'rgba(253, 251, 247, 0.85)' } : undefined}>
              {hero.subtitle}
            </p>
            <div className="hero-actions">
              <Link href="/shop" className="btn btn-gold btn-lg" id="hero-shop-btn">
                Explore Products →
              </Link>
              <Link href="/about" className="btn btn-outline-gold btn-lg" style={hero.image ? { color: 'var(--color-cream)', borderColor: 'var(--color-saffron-light)' } : undefined}>
                Our Story
              </Link>
            </div>
          </div>
          <div className="hero-visual" style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="hero-image-wrapper" style={{ position: 'relative', width: '100%', maxWidth: 450, height: 450, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                position: 'absolute', width: 350, height: 350,
                borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,133,42,0.25) 0%, transparent 70%)',
                filter: 'blur(30px)', animation: 'pulse 4s infinite'
              }} />
              <div style={{
                position: 'relative', width: '85%', height: '85%',
                background: 'rgba(24, 24, 27, 0.55)',
                backdropFilter: 'blur(20px)',
                border: '1.5px solid rgba(196, 133, 42, 0.25)',
                borderRadius: 32,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: 'var(--space-6)',
                boxShadow: 'var(--shadow-xl), 0 0 40px rgba(196,133,42,0.08)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '5rem', marginBottom: 'var(--space-4)', filter: 'drop-shadow(0 4px 12px rgba(196,133,42,0.3))' }}>
                  🌿
                </div>
                <div style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.4rem',
                  fontWeight: 600,
                  color: 'var(--color-saffron-light)',
                  letterSpacing: '0.05em',
                  marginBottom: 'var(--space-3)'
                }}>
                  SIDDHAM
                </div>
                <div style={{
                  height: 1, width: 60,
                  background: 'var(--color-saffron)',
                  marginBottom: 'var(--space-4)'
                }} />
                <p style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: '0.9rem',
                  color: 'rgba(248, 244, 238, 0.8)',
                  lineHeight: 1.6,
                  maxWidth: 280,
                  margin: 0
                }}>
                  "स्वस्थस्य स्वास्थ्यरक्षणं, आतुरस्य विकारप्रशमनं च ।"
                </p>
                <span style={{
                  fontSize: '0.65rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--color-gray-400)',
                  marginTop: 'var(--space-3)',
                  display: 'block'
                }}>
                  — Charak Samhita
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust Bar / Badges ────────────────────────────────── */}
      <section style={{ background: 'var(--color-cream)', padding: 'var(--space-2) 0' }}>
        <div className="container">
          <div className="trust-badges-container">
            {[
              { icon: '🌿', title: '100% Organic', desc: 'Sourced from organic forest farms' },
              { icon: '🔬', title: 'Lab Tested', desc: 'Purity & potency certified' },
              { icon: '🚚', title: 'Free Shipping', desc: 'On orders above ₹999' },
              { icon: '🏆', title: 'GMP Certified', desc: 'Highest safety standards' },
            ].map((item, i) => (
              <div key={i} className="trust-badge">
                <span className="trust-badge-icon">{item.icon}</span>
                <h4 className="trust-badge-title">{item.title}</h4>
                <p className="trust-badge-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ────────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-cream)' }}>
        <div className="container">
          <div className="section-heading">
            <span className="section-eyebrow">Shop by Category</span>
            <h2>What Are You Looking For?</h2>
            <div className="divider-leaf"><span>✦</span></div>
            <p>Explore our range of Ayurvedic solutions tailored for every wellness need.</p>
          </div>
          <div className="grid-4">
            {categories.length > 0 ? categories.map(cat => (
              <Link href={`/shop?category=${cat.slug}`} key={cat.id}>
                <div className="category-card">
                  <span className="category-icon">{CATEGORY_ICONS[cat.slug] || '🌿'}</span>
                  <div className="category-name">{cat.name}</div>
                  <div className="category-count">{cat._count.products} Products</div>
                </div>
              </Link>
            )) : [
              { icon: '💆', name: 'Hair Care', count: '12+ Products' },
              { icon: '💊', name: 'Supplements', count: '8+ Products' },
              { icon: '✨', name: 'Skin Care', count: '6+ Products' },
              { icon: '🌿', name: 'Oils', count: '5+ Products' },
            ].map((c, i) => (
              <div className="category-card" key={i}>
                <span className="category-icon">{c.icon}</span>
                <div className="category-name">{c.name}</div>
                <div className="category-count">{c.count}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products ──────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-white)' }}>
        <div className="container">
          <div className="section-heading">
            <span className="section-eyebrow">Bestsellers</span>
            <h2>Our Signature Products</h2>
            <div className="divider-leaf"><span>✦</span></div>
            <p>Handcrafted formulations that embody the essence of Ayurvedic healing.</p>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="product-grid">
              {featuredProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-gray-400)' }}>
              Loading products...
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 'var(--space-10)' }}>
            <Link href="/shop" className="btn btn-outline btn-lg">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* ── Brand Story ───────────────────────────────────────── */}
      <section className="section" style={{
        background: 'linear-gradient(135deg, var(--color-forest-dark), var(--color-forest))',
        color: 'var(--color-parchment)',
      }}>
        <div className="container">
          <div className="brand-story-grid">
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-saffron-light)', display: 'block', marginBottom: '1rem' }}>
                Our Philosophy
              </span>
              <h2 style={{ color: 'var(--color-parchment)', marginBottom: '1.5rem' }}>
                Where Ancient Science Meets Modern Life
              </h2>
              <p style={{ color: 'rgba(248,244,238,0.75)', marginBottom: '1.5rem', lineHeight: 1.8 }}>
                At Siddham Wellness, we believe that true health is a balance of mind, body, and spirit.
                Our products are rooted in the 5,000-year tradition of Ayurveda — using herbs that have
                been trusted for generations to heal and nourish.
              </p>
              <p style={{ color: 'rgba(248,244,238,0.75)', lineHeight: 1.8 }}>
                Every formulation is carefully crafted with sustainably sourced ingredients,
                lab-tested for purity, and free from harmful chemicals.
              </p>
              <Link href="/about" className="btn btn-gold" style={{ marginTop: '2rem' }}>
                Discover Our Story →
              </Link>
            </div>
            <div className="grid-2">
              {[
                { num: '5000+', label: 'Years of Wisdom' },
                { num: '50+', label: 'Herbal Ingredients' },
                { num: '10K+', label: 'Happy Customers' },
                { num: '100%', label: 'Natural & Safe' },
              ].map((s, i) => (
                <div key={i} style={{
                  background: 'rgba(248,244,238,0.07)',
                  border: '1px solid rgba(196,133,42,0.2)',
                  borderRadius: 12,
                  padding: '1.5rem',
                  textAlign: 'center',
                }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 700, color: 'var(--color-saffron-light)' }}>
                    {s.num}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(248,244,238,0.6)', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-parchment)' }}>
        <div className="container">
          <div className="section-heading">
            <span className="section-eyebrow">Testimonials</span>
            <h2>Loved by Thousands</h2>
            <div className="divider-leaf"><span>✦</span></div>
          </div>
          <div className="grid-3">
            {[
              {
                name: 'Priya Sharma',
                location: 'Mumbai',
                text: 'The Brahmi Amla Shampoo has completely transformed my hair. Less fall, more shine. I\'ve been using it for 3 months and won\'t switch back!',
                rating: 5,
              },
              {
                name: 'Arjun Mehta',
                location: 'Bengaluru',
                text: 'The Ashwagandha capsules have been a game-changer for my stress levels and sleep quality. I feel more energized throughout the day.',
                rating: 5,
              },
              {
                name: 'Sunita Patel',
                location: 'Ahmedabad',
                text: 'Finally found skincare that works with my skin and not against it. The Kumkumadi oil is pure luxury — my skin has never looked better!',
                rating: 5,
              },
            ].map((t, i) => (
              <div key={i} className="card">
                <div className="card-body">
                  <div style={{ color: 'var(--color-saffron)', fontSize: '1.1rem', marginBottom: 'var(--space-3)' }}>
                    {'⭐'.repeat(t.rating)}
                  </div>
                  <p style={{ fontStyle: 'italic', marginBottom: 'var(--space-4)', color: 'var(--color-gray-700)', lineHeight: 1.7 }}>
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--color-forest), var(--color-sage))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 700, fontSize: '0.9rem',
                    }}>
                      {t.name[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-forest-dark)' }}>{t.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>{t.location}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
