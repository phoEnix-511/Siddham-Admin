import React from 'react';
import { GetStaticProps } from 'next';
import { prisma } from '@/lib/prisma';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';

export const getStaticProps: GetStaticProps = async () => {
  try {
    const [products, categories, settingsRecords] = await Promise.all([
      prisma.product.findMany({
        where: { isFeatured: true },
        take: 10,
        select: {
          id: true, name: true, price: true, comparePrice: true,
          images: true, stock: true, isFeatured: true,
          category: { select: { name: true, slug: true } },
          description: true, variants: { select: { id: true, name: true, price: true, stock: true } }
        }
      }),
      prisma.category.findMany({ orderBy: { name: 'asc' } }),
      prisma.setting.findMany(),
    ]);

    const settings = settingsRecords.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, string>);

    return {
      props: {
        featuredProducts: JSON.parse(JSON.stringify(products)),
        categories: JSON.parse(JSON.stringify(categories)),
        hero: {
          title: settings.hero_title || 'Heal Naturally. Live Wholly.',
          subtitle: settings.hero_subtitle || 'Discover our curated range of authentic Ayurvedic formulations.',
          image: settings.hero_image || 'https://images.unsplash.com/photo-1595981267035-7b04d84b4f1e?q=80&w=2070',
        },
        promotional: {
          showFeaturedIn: settings.show_featured_in !== 'false',
          featuredBrands: settings.featured_in_brands ? settings.featured_in_brands.split(',').map((b: string) => b.trim()).filter(Boolean) : ['The Times', 'VOGUE', 'GQ', 'Wellness Daily'],
          trustBarRating: settings.trust_bar_rating || '4.8',
          trustBarCount: settings.trust_bar_count || '50,000+',
        },
        catalogMode: settings.catalog_mode === 'true',
      },
      revalidate: 60, // ISR: regenerate at most once per minute
    };
  } catch (error) {
    console.error('Error in index getStaticProps:', error);
    return {
      props: {
        featuredProducts: [],
        categories: [],
        hero: {
          title: 'Heal Naturally. Live Wholly.',
          subtitle: 'Discover our curated range of authentic Ayurvedic formulations.',
          image: 'https://images.unsplash.com/photo-1595981267035-7b04d84b4f1e?q=80&w=2070',
        },
        promotional: {
          showFeaturedIn: true,
          featuredBrands: ['The Times', 'VOGUE', 'GQ', 'Wellness Daily'],
          trustBarRating: '4.8',
          trustBarCount: '50,000+',
        },
        catalogMode: false,
      },
      revalidate: 30,
    };
  }
};

export default function Home({ featuredProducts, categories, hero, promotional, catalogMode }: { featuredProducts: any[], categories: any[], hero: any, promotional: any, catalogMode: boolean }) {
  // Hook for slideshow
  const [activeSlide, setActiveSlide] = React.useState(0);
  const slideImages = [
    '/images/banner1.jpg',
    '/images/banner2.jpg',
    '/images/banner3.jpg',
    '/images/banner4.jpg'
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slideImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // References for slider elements to enable arrow scrolling
  const curatedSliderRef = React.useRef<HTMLDivElement>(null);
  const featuredSliderRef = React.useRef<HTMLDivElement>(null);

  const scrollSlider = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmt = direction === 'left' ? -350 : 350;
      ref.current.scrollBy({ left: scrollAmt, behavior: 'smooth' });
    }
  };

  // Dedicated concerns catalog
  const concernsList = [
    { name: 'Brain wellness', icon: '🧠', slug: 'brain-wellness' },
    { name: 'Cardiac wellness', icon: '❤️', slug: 'cardiac-wellness' },
    { name: 'Daily wellness', icon: '🌟', slug: 'daily-wellness' },
    { name: 'Diabetic wellness', icon: '🩸', slug: 'diabetic-wellness' },
    { name: 'Digestive wellness', icon: '🥣', slug: 'digestive-wellness' },
    { name: 'Hair wellness', icon: '💆‍♀️', slug: 'hair-wellness' },
    { name: 'Immunity wellness', icon: '🛡️', slug: 'immunity-wellness' },
    { name: 'Kidney wellness', icon: '💧', slug: 'kidney-wellness' },
    { name: 'liver wellness', icon: '🍃', slug: 'liver-wellness' },
    { name: 'men\'s wellness', icon: '💪', slug: 'mens-wellness' },
    { name: 'Pain reliever', icon: '🔥', slug: 'pain-reliever' },
    { name: 'Skin wellness', icon: '✨', slug: 'skin-wellness' },
    { name: 'Stamina Booster', icon: '⚡', slug: 'stamina-booster' },
    { name: 'Women\'s wellness', icon: '🌺', slug: 'womens-wellness' },
    { name: 'Blood purify', icon: '🍷', slug: 'blood-purify' }
  ];

  return (
    <>
      <Head>
        <title>Siddham Wellness – Authentic Ayurveda</title>
      </Head>

      {/* 1. Announcement Bar */}
      <div className="announcement-bar">
        <div className="marquee-container">
          <div className="marquee-content">
            {catalogMode ? (
              <>
                <span>🌿 100% Natural Ayurvedic Ingredients</span>
                <span>✨ Ancient Wisdom, Modern Wellness</span>
                <span>🌿 100% Natural Ayurvedic Ingredients</span>
                <span>✨ Ancient Wisdom, Modern Wellness</span>
                <span>🌿 100% Natural Ayurvedic Ingredients</span>
                <span>✨ Ancient Wisdom, Modern Wellness</span>
              </>
            ) : (
              <>
                <span>Free Shipping on orders over ₹499</span>
                <span>🌿 100% Natural Ayurvedic Ingredients</span>
                <span>Free Shipping on orders over ₹499</span>
                <span>🌿 100% Natural Ayurvedic Ingredients</span>
                <span>Free Shipping on orders over ₹499</span>
                <span>🌿 100% Natural Ayurvedic Ingredients</span>
              </>
            )}
          </div>
        </div>
      </div>

      <Navbar />

      {/* 2. Multi-List Quick Links (Circular Concerns Shortcut) */}
      <div className="multi-list-links">
        <div className="container" style={{ padding: 0 }}>
          <div className="multi-list-scroll">
            <Link href="/shop" className="multi-list-item">
              <div className="multi-list-image-wrap">
                <div style={{ fontSize: '2rem' }}>🌿</div>
              </div>
              <span className="multi-list-label">All<br/>Products</span>
            </Link>
            {concernsList.slice(0, 10).map((concern, i) => (
              <Link key={i} href={`/shop?category=${concern.slug}`} className="multi-list-item">
                <div className="multi-list-image-wrap">
                  <div style={{ fontSize: '1.8rem' }}>{concern.icon}</div>
                </div>
                <span className="multi-list-label">{concern.name.replace(' ', '\n')}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Hero Slideshow Banner (4 images moving every 5 seconds) */}
      <section className="hero-slideshow" style={{ width: '100%', position: 'relative', height: '62vh', minHeight: '420px', overflow: 'hidden' }}>
        {slideImages.map((img, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `linear-gradient(rgba(15,35,24,0.35), rgba(15,35,24,0.75)), url(${img})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: idx === activeSlide ? 1 : 0,
              transition: 'opacity 1s ease-in-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: 'var(--space-6)'
            }}
          >
            {idx === activeSlide && (
              <div style={{ maxWidth: '800px', transform: 'translateY(0)', transition: 'transform 0.8s ease' }}>
                <h1 style={{ color: 'var(--color-cream)', fontSize: 'clamp(2.2rem, 5vw, 4.2rem)', marginBottom: 'var(--space-3)', fontFamily: 'var(--font-serif)', textShadow: '1px 1px 3px rgba(0,0,0,0.3)' }}>
                  Heal Naturally. Live Wholly.
                </h1>
                <p style={{ color: 'var(--color-saffron-pale)', fontSize: 'clamp(1rem, 2vw, 1.25rem)', maxWidth: '650px', margin: '0 auto var(--space-6)', fontWeight: 500 }}>
                  {hero.subtitle || 'Authentic Ayurvedic wellness for a healthier, more natural lifestyle'}
                </p>
                <Link href="/shop" className="btn btn-gold btn-lg" style={{ borderRadius: '9999px', padding: '15px 36px', fontWeight: 'bold' }}>
                  Explore Collection
                </Link>
              </div>
            )}
          </div>
        ))}
        {/* Slideshow Dot Indicators */}
        <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 10 }}>
          {slideImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: idx === activeSlide ? 'var(--color-saffron)' : 'rgba(255,255,255,0.4)',
                border: 'none',
                cursor: 'pointer',
                padding: 0
              }}
              aria-label={`Show slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* 4. Trust Bar */}
      <div className="trust-bar">
        <span className="trust-stars">★★★★★</span>
        <span className="trust-bar-text">Rated {promotional.trustBarRating} by {promotional.trustBarCount} Customers</span>
        <span className="trust-stars">★★★★★</span>
      </div>

      {/* 5. Curated Specially For You (Product Slider with arrow controls in PC) */}
      <section className="section" style={{ position: 'relative' }}>
        <div className="container">
          <h2 className="vasu-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Curated Specially For You!
            <div className="slider-arrows-wrapper" style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => scrollSlider(curatedSliderRef, 'left')} className="btn btn-outline" style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>⟨</button>
              <button onClick={() => scrollSlider(curatedSliderRef, 'right')} className="btn btn-outline" style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>⟩</button>
            </div>
          </h2>
          <div className="vasu-slider" ref={curatedSliderRef} style={{ display: 'flex', overflowX: 'auto', gap: '20px', scrollBehavior: 'smooth', paddingBottom: '15px' }}>
            {featuredProducts.slice(0, 8).map(p => (
              <div key={p.id} className="vasu-slide product" style={{ minWidth: '280px', flex: '0 0 auto' }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Shop by Concern (Visual Circular Icons Grid Matching Spec) */}
      <section className="section" style={{ background: 'var(--color-cream)' }}>
        <div className="container">
          <h2 className="vasu-section-title" style={{ justifyContent: 'center', fontSize: '1.8rem', letterSpacing: '0.05em' }}>
            🌿 SHOP BY CONCERN 🌿
          </h2>
          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-gray-500)', marginTop: '-10px', marginBottom: 'var(--space-8)' }}>
            Rooted in Ayurveda. Crafted for Wellness.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 'var(--space-6)',
            justifyContent: 'center',
            alignItems: 'start'
          }}>
            {concernsList.map((concern, idx) => (
              <Link
                key={idx}
                href={`/shop?category=${concern.slug}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textDecoration: 'none',
                  textAlign: 'center',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid var(--color-saffron)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.4rem',
                  boxShadow: 'var(--shadow-sm)',
                  marginBottom: '10px'
                }}>
                  {concern.icon}
                </div>
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'var(--color-forest-dark)',
                  textTransform: 'capitalize',
                  lineHeight: '1.2'
                }}>
                  {concern.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Featured Collections (Product Slider with arrow controls in PC) */}
      <section className="section" style={{ position: 'relative' }}>
        <div className="container">
          <h2 className="vasu-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Featured Collections
            <div className="slider-arrows-wrapper" style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => scrollSlider(featuredSliderRef, 'left')} className="btn btn-outline" style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>⟨</button>
              <button onClick={() => scrollSlider(featuredSliderRef, 'right')} className="btn btn-outline" style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>⟩</button>
            </div>
          </h2>
          <div className="vasu-slider" ref={featuredSliderRef} style={{ display: 'flex', overflowX: 'auto', gap: '20px', scrollBehavior: 'smooth', paddingBottom: '15px' }}>
            {featuredProducts.slice(2, 10).map(p => (
              <div key={p.id} className="vasu-slide product" style={{ minWidth: '280px', flex: '0 0 auto' }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Promotional Banner Image */}
      <section className="section-sm">
        <div className="container">
          {catalogMode ? (
            <div className="vasu-promo-banner" style={{ background: 'var(--color-forest-light)' }}>
              <div style={{ position: 'relative', zIndex: 2 }}>
                <h2 style={{ color: 'white', marginBottom: 'var(--space-2)' }}>Experience Authentic Ayurveda</h2>
                <p style={{ fontSize: '1.1rem', marginBottom: 'var(--space-4)', maxWidth: '650px', margin: '0 auto var(--space-4)' }}>
                  Formulations rooted in ancient scriptures, prepared with organic forest herbs, and validated by modern science.
                </p>
                <Link href="/about" className="btn btn-gold">Our Philosophy</Link>
              </div>
              <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '40%', height: '200%', background: 'rgba(207,176,125,0.06)', transform: 'rotate(15deg)' }} />
            </div>
          ) : (
            <div className="vasu-promo-banner">
              <div style={{ position: 'relative', zIndex: 2 }}>
                <h2 style={{ color: 'white', marginBottom: 'var(--space-2)' }}>Build Your Own Wellness Bundle</h2>
                <p style={{ fontSize: '1.1rem', marginBottom: 'var(--space-4)' }}>Pick any 3 products and save 25% instantly.</p>
                <Link href="/bundles" className="btn btn-gold">Build Now</Link>
              </div>
              {/* Background design elements */}
              <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '40%', height: '200%', background: 'rgba(196,133,42,0.1)', transform: 'rotate(15deg)' }} />
            </div>
          )}
        </div>
      </section>

      {/* 9. Offers & Deals Bottom Section */}
      <section className="section" style={{ background: 'var(--color-parchment)', borderTop: '1px solid rgba(13, 44, 29, 0.06)' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontFamily: 'var(--font-serif)', color: 'var(--color-forest-dark)', fontSize: '2rem', marginBottom: 'var(--space-8)' }}>
            🎁 Our Offers and Deals 🎁
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
            <div style={{ backgroundColor: '#ffffff', border: '1.5px dashed var(--color-saffron)', borderRadius: '12px', padding: 'var(--space-5)', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <span style={{ fontSize: '2.5rem' }}>🎫</span>
              <h3 style={{ color: 'var(--color-forest)', margin: '10px 0' }}>Flat 10% OFF</h3>
              <p style={{ fontSize: '0.88rem', margin: '0 0 var(--space-4)' }}>Enjoy flat 10% off on your first order. Use code at signup.</p>
              <div style={{ background: 'var(--color-parchment)', padding: '8px', border: '1px solid var(--color-saffron-light)', borderRadius: '6px', fontWeight: 'bold', display: 'inline-block', letterSpacing: '0.1em' }}>FIRST10</div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1.5px dashed var(--color-saffron)', borderRadius: '12px', padding: 'var(--space-5)', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <span style={{ fontSize: '2.5rem' }}>📦</span>
              <h3 style={{ color: 'var(--color-forest)', margin: '10px 0' }}>Free Shipping</h3>
              <p style={{ fontSize: '0.88rem', margin: '0 0 var(--space-4)' }}>Get items delivered directly to your home for free on orders above ₹499.</p>
              <div style={{ background: 'var(--color-parchment)', padding: '8px', border: '1px solid var(--color-saffron-light)', borderRadius: '6px', fontWeight: 'bold', display: 'inline-block' }}>AUTO APPLIED</div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1.5px dashed var(--color-saffron)', borderRadius: '12px', padding: 'var(--space-5)', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <span style={{ fontSize: '2.5rem' }}>🍯</span>
              <h3 style={{ color: 'var(--color-forest)', margin: '10px 0' }}>Triphala Deal</h3>
              <p style={{ fontSize: '0.88rem', margin: '0 0 var(--space-4)' }}>Buy any organic single herb powders and get 15% off coupon automatically.</p>
              <div style={{ background: 'var(--color-parchment)', padding: '8px', border: '1px solid var(--color-saffron-light)', borderRadius: '6px', fontWeight: 'bold', display: 'inline-block' }}>HERBAL15</div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Scrolling Text Marquee */}
      <div className="announcement-bar" style={{ background: 'var(--color-saffron)', color: 'var(--color-forest-dark)', padding: '12px 0' }}>
        <div className="marquee-container">
          <div className="marquee-content">
            <span>100% AYURVEDIC</span> <span>•</span>
            <span>SCIENCE-BACKED</span> <span>•</span>
            <span>CRUELTY-FREE</span> <span>•</span>
            <span>NO HARSH CHEMICALS</span> <span>•</span>
            <span>100% AYURVEDIC</span> <span>•</span>
            <span>SCIENCE-BACKED</span> <span>•</span>
            <span>CRUELTY-FREE</span> <span>•</span>
            <span>NO HARSH CHEMICALS</span>
          </div>
        </div>
      </div>

      {/* 11. As Featured In */}
      {promotional.showFeaturedIn && promotional.featuredBrands.length > 0 && (
        <section className="section">
          <div className="container">
            <h3 style={{ textAlign: 'center', color: 'var(--color-gray-500)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 'var(--space-5)' }}>
              As Featured In
            </h3>
            <div className="featured-logos">
              {promotional.featuredBrands.map((brand: string, i: number) => (
                <div key={i} style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: i % 2 === 0 ? 'serif' : 'sans-serif', letterSpacing: i % 2 !== 0 ? -1 : 0 }}>
                  {brand}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </>
  );
}