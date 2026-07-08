import React from 'react';
import { GetStaticProps } from 'next';
import { prisma } from '@/lib/prisma';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { CONCERN_CATEGORIES, CONCERN_ICONS } from '@/lib/concerns';
import { getOrSet } from '@/lib/cache';

const DEFAULT_CAROUSEL_IMAGES = ['/images/banner2.jpg', '/images/banner3.jpg', '/images/banner4.jpg'];

function parseCarouselImages(value?: string) {
  return (value || '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export const getStaticProps: GetStaticProps = async () => {
  try {
    const [products, categories, settingsMap, coupons] = await Promise.all([
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
      getOrSet('homepage:settings', 60 * 10, async () => {
        const settingsRecords = await prisma.setting.findMany();
        return settingsRecords.reduce((acc, s) => {
          acc[s.key] = s.value;
          return acc;
        }, {} as Record<string, string>);
      }),
      prisma.couponOffer.findMany({ where: { isActive: true }, take: 3 })
    ]);

    const settings = settingsMap as Record<string, string>;
    const carouselImages = parseCarouselImages(settings.homepage_carousel_images);

    return {
      props: {
        featuredProducts: JSON.parse(JSON.stringify(products)),
        categories: JSON.parse(JSON.stringify(categories)),
        coupons: JSON.parse(JSON.stringify(coupons)),
        hero: {
          title: settings.hero_title || 'Heal Naturally. Live Wholly.',
          subtitle: settings.hero_subtitle || 'Discover our curated range of authentic Ayurvedic formulations.',
          image: settings.hero_image || 'https://images.unsplash.com/photo-1595981267035-7b04d84b4f1e?q=80&w=2070',
        },
        carouselImages: carouselImages.length > 0 ? carouselImages : DEFAULT_CAROUSEL_IMAGES,
        promotional: {
          showFeaturedIn: settings.show_featured_in !== 'false',
          featuredBrands: settings.featured_in_brands ? settings.featured_in_brands.split(',').map((b: string) => b.trim()).filter(Boolean) : ['The Times', 'VOGUE', 'GQ', 'Wellness Daily'],
          trustBarRating: settings.trust_bar_rating || '4.8',
          trustBarCount: settings.trust_bar_count || '50,000+',
          freeShippingThreshold: settings.free_shipping_threshold || '499',
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
        coupons: [],
        hero: {
          title: 'Heal Naturally. Live Wholly.',
          subtitle: 'Discover our curated range of authentic Ayurvedic formulations.',
          image: 'https://images.unsplash.com/photo-1595981267035-7b04d84b4f1e?q=80&w=2070',
        },
        carouselImages: DEFAULT_CAROUSEL_IMAGES,
        promotional: {
          showFeaturedIn: true,
          featuredBrands: ['The Times', 'VOGUE', 'GQ', 'Wellness Daily'],
          trustBarRating: '4.8',
          trustBarCount: '50,000+',
          freeShippingThreshold: '499',
        },
        catalogMode: false,
      },
      revalidate: 30,
    };
  }
};

export default function Home({ featuredProducts, categories, coupons = [], hero, promotional, catalogMode, carouselImages = DEFAULT_CAROUSEL_IMAGES }: { featuredProducts: any[], categories: any[], coupons?: any[], hero: any, promotional: any, catalogMode: boolean, carouselImages?: string[] }) {
  // Hook for slideshow
  const [activeSlide, setActiveSlide] = React.useState(0);
  const slideImages = React.useMemo(() => (carouselImages && carouselImages.length > 0 ? carouselImages : DEFAULT_CAROUSEL_IMAGES), [carouselImages]);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slideImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slideImages.length]);

  // References for slider elements to enable arrow scrolling
  const curatedSliderRef = React.useRef<HTMLDivElement>(null);
  const featuredSliderRef = React.useRef<HTMLDivElement>(null);

  const scrollSlider = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmt = direction === 'left' ? -350 : 350;
      ref.current.scrollBy({ left: scrollAmt, behavior: 'smooth' });
    }
  };

  const concernsList = CONCERN_CATEGORIES;

  return (
    <>
      <Head>
        <title>Siddham Wellness – Authentic Ayurvedic Products</title>
        <meta name="description" content="Discover Siddham Wellness — premium Ayurvedic hair care, herbal supplements, and natural skincare rooted in ancient wisdom. Free shipping on orders above ₹{promotional.freeShippingThreshold}." />
        <meta property="og:title" content="Siddham Wellness – Ancient Wisdom, Modern Wellness" />
        <meta property="og:description" content="Premium Ayurvedic products crafted with pure ingredients for holistic wellbeing. Explore our curated range of herbal formulations." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.siddhamwellness.com/" />
        <meta name="twitter:title" content="Siddham Wellness – Ancient Wisdom, Modern Wellness" />
        <link rel="canonical" href="https://www.siddhamwellness.com/" />
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
                <span>Free Shipping on orders over ₹{promotional.freeShippingThreshold}</span>
                <span>🌿 100% Natural Ayurvedic Ingredients</span>
                <span>Free Shipping on orders over ₹{promotional.freeShippingThreshold}</span>
                <span>🌿 100% Natural Ayurvedic Ingredients</span>
                <span>Free Shipping on orders over ₹{promotional.freeShippingThreshold}</span>
                <span>🌿 100% Natural Ayurvedic Ingredients</span>
              </>
            )}
          </div>
        </div>
      </div>

      <Navbar />

      {/* 2. Top Category Quick Links — using matching concern images and scroll arrows */}
      <div className="multi-list-links" style={{ position: 'relative' }}>
        {/* Left Arrow Button for Desktop scrolling */}
        <button
          onClick={() => {
            const el = document.getElementById('top-categories-scroll');
            if (el) el.scrollBy({ left: -220, behavior: 'smooth' });
          }}
          className="slider-nav-btn slider-nav-left"
          style={{ width: '36px', height: '36px', fontSize: '1.2rem', top: '50%' }}
          aria-label="Scroll top categories left"
        >&#8249;</button>

        <div className="container" style={{ padding: 0 }}>
          <div id="top-categories-scroll" className="multi-list-scroll" style={{ scrollBehavior: 'smooth' }}>
            <Link href="/shop" className="multi-list-item">
              <div className="multi-list-image-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <img src="/images/concerns/daily-wellness.png" alt="All Products" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span className="multi-list-label" style={{ whiteSpace: 'pre-line' }}>All{"\n"}Products</span>
            </Link>
            {concernsList.map((concern, i) => (
              <Link key={i} href={`/shop?category=${concern.slug}`} className="multi-list-item">
                <div className="multi-list-image-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img src={`/images/concerns/${concern.slug}.png`} alt={concern.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <span className="multi-list-label" style={{ whiteSpace: 'pre-line' }}>{concern.name.replace(/ /g, '\n')}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Right Arrow Button for Desktop scrolling */}
        <button
          onClick={() => {
            const el = document.getElementById('top-categories-scroll');
            if (el) el.scrollBy({ left: 220, behavior: 'smooth' });
          }}
          className="slider-nav-btn slider-nav-right"
          style={{ width: '36px', height: '36px', fontSize: '1.2rem', top: '50%' }}
          aria-label="Scroll top categories right"
        >&#8250;</button>
      </div>

      {/* 3. Hero Slideshow Banner — clean images with blurred full-bleed background on wide screens */}
      <section style={{ width: '100%', position: 'relative', aspectRatio: '16 / 9', overflow: 'hidden', background: '#000', borderRadius: '16px 16px 16px 16px', boxShadow: '0 16px 40px rgba(6, 26, 17, 0.16)' }}>
        {slideImages.map((img, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: idx === activeSlide ? 1 : 0,
              transition: 'opacity 1.2s ease-in-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Blurred background backdrop (visible when screen aspect leaves gaps) */}
            <div
              className="hero-blur-backdrop"
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${img})`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                filter: 'blur(16px) brightness(0.65)',
                transform: 'scale(1.1)', // Prevents white borders from blur filter
                zIndex: 1
              }}
            />
            {/* Crisp centered main image */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                backgroundImage: `url(${img})`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                zIndex: 2
              }}
            />
          </div>
        ))}

        {/* Explore button — glass pill floating at bottom center */}
        <div style={{
          position: 'absolute',
          bottom: '36px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10
        }}>
          <Link
            href="/shop"
            style={{
              display: 'inline-block',
              padding: '14px 10px',
              borderRadius: '9999px',
              background: 'rgba(172, 172, 172, 0.22)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '1rem',
              letterSpacing: '0.06em',
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              border: '1px solid rgba(255,255,255,0.2)',
              transition: 'background 0.2s, transform 0.2s'
            }}
          >
            Explore Collection →
          </Link>
        </div>

        {/* Dot Indicators */}
        <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 10 }}>
          {slideImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              aria-label={`Show slide ${idx + 1}`}
              style={{
                width: idx === activeSlide ? '24px' : '8px',
                height: '8px',
                borderRadius: '9999px',
                backgroundColor: idx === activeSlide ? 'var(--color-saffron)' : 'rgba(255,255,255,0.55)',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.3s'
              }}
            />
          ))}
        </div>

        {/* Prev / Next arrows */}
        <button
          onClick={() => setActiveSlide((activeSlide - 1 + slideImages.length) % slideImages.length)}
          aria-label="Previous slide"
          style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)', border: 'none', borderRadius: '50%', width: '42px', height: '42px', fontSize: '1.2rem', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >‹</button>
        <button
          onClick={() => setActiveSlide((activeSlide + 1) % slideImages.length)}
          aria-label="Next slide"
          style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)', border: 'none', borderRadius: '50%', width: '42px', height: '42px', fontSize: '1.2rem', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >›</button>
      </section>

      {/* 4. Trust Bar */}
      <div className="trust-bar">
        <span className="trust-stars">★★★★★</span>
        <span className="trust-bar-text">Rated {promotional.trustBarRating} by {promotional.trustBarCount} Customers</span>
        <span className="trust-stars">★★★★★</span>
      </div>

      {/* 5. Curated Specially For You — side-arrow scrollable slider */}
      <section className="section" style={{ position: 'relative' }}>
        <div className="container">
          <h2 className="vasu-section-title">Curated Specially For You!</h2>
        </div>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => scrollSlider(curatedSliderRef, 'left')}
            aria-label="Scroll left"
            className="slider-nav-btn slider-nav-left"
          >&#8249;</button>

          <div ref={curatedSliderRef} className="slider-track">
            {featuredProducts.slice(0, 8).map(p => (
              <div key={p.id} className="slider-card-wrap">
                <ProductCard product={p} />
              </div>
            ))}
          </div>

          <button
            onClick={() => scrollSlider(curatedSliderRef, 'right')}
            aria-label="Scroll right"
            className="slider-nav-btn slider-nav-right"
          >&#8250;</button>
        </div>
      </section>

      {/* 6. Shop by Concern — real circle icon photos */}
      <section className="section" style={{ background: 'var(--color-cream)' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', color: 'var(--color-forest-dark)', marginBottom: '6px', letterSpacing: '0.04em' }}>
            🌿 Shop by Concern
          </h2>
          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-gray-500)', marginBottom: 'var(--space-8)' }}>
            Rooted in Ayurveda. Crafted for Wellness.
          </p>

          <div className="concern-grid-5col">
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
                  transition: 'transform 0.25s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {/* Real icon image from extracted PNGs */}
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid rgba(13,44,29,0.12)',
                  boxShadow: '0 2px 12px rgba(13,44,29,0.08)',
                  marginBottom: '10px',
                  backgroundColor: 'var(--color-parchment)'
                }}>
                  <img
                    src={`/images/concerns/${concern.slug}.png`}
                    alt={concern.name}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      // fallback to emoji if image missing
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--color-forest-dark)',
                  lineHeight: '1.25'
                }}>
                  {concern.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Featured Collections — side-arrow scrollable slider */}
      <section className="section" style={{ position: 'relative' }}>
        <div className="container">
          <h2 className="vasu-section-title">Featured Collections</h2>
        </div>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => scrollSlider(featuredSliderRef, 'left')}
            aria-label="Scroll featured left"
            className="slider-nav-btn slider-nav-left"
          >&#8249;</button>

          <div ref={featuredSliderRef} className="slider-track">
            {featuredProducts.slice(2, 10).map(p => (
              <div key={p.id} className="slider-card-wrap">
                <ProductCard product={p} />
              </div>
            ))}
          </div>

          <button
            onClick={() => scrollSlider(featuredSliderRef, 'right')}
            aria-label="Scroll featured right"
            className="slider-nav-btn slider-nav-right"
          >&#8250;</button>
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
            {coupons && coupons.length > 0 ? (
              coupons.map((c: any, i: number) => (
                <div key={i} style={{ backgroundColor: '#ffffff', border: '1.5px dashed var(--color-saffron)', borderRadius: '12px', padding: 'var(--space-5)', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                  <span style={{ fontSize: '2.5rem' }}>🎫</span>
                  <h3 style={{ color: 'var(--color-forest)', margin: '10px 0' }}>{c.discountType === 'PERCENTAGE' ? `${c.value}% OFF` : `₹${c.value} OFF`}</h3>
                  <p style={{ fontSize: '0.88rem', margin: '0 0 var(--space-4)' }}>
                    {c.description || `Get ${c.discountType === 'PERCENTAGE' ? `${c.value}%` : `₹${c.value}`} discount on orders.`} 
                    {c.minCartValue > 0 && ` Applicable on minimum cart value of ₹${c.minCartValue}.`}
                  </p>
                  <div style={{ background: 'var(--color-parchment)', padding: '8px', border: '1px solid var(--color-saffron-light)', borderRadius: '6px', fontWeight: 'bold', display: 'inline-block', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {c.code}
                  </div>
                </div>
              ))
            ) : (
              <>
                <div style={{ backgroundColor: '#ffffff', border: '1.5px dashed var(--color-saffron)', borderRadius: '12px', padding: 'var(--space-5)', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                  <span style={{ fontSize: '2.5rem' }}>🎫</span>
                  <h3 style={{ color: 'var(--color-forest)', margin: '10px 0' }}>Flat 10% OFF</h3>
                  <p style={{ fontSize: '0.88rem', margin: '0 0 var(--space-4)' }}>Enjoy flat 10% off on your first order. Use code at signup.</p>
                  <div style={{ background: 'var(--color-parchment)', padding: '8px', border: '1px solid var(--color-saffron-light)', borderRadius: '6px', fontWeight: 'bold', display: 'inline-block', letterSpacing: '0.1em' }}>FIRST10</div>
                </div>

                <div style={{ backgroundColor: '#ffffff', border: '1.5px dashed var(--color-saffron)', borderRadius: '12px', padding: 'var(--space-5)', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                  <span style={{ fontSize: '2.5rem' }}>📦</span>
                  <h3 style={{ color: 'var(--color-forest)', margin: '10px 0' }}>Free Shipping</h3>
                  <p style={{ fontSize: '0.88rem', margin: '0 0 var(--space-4)' }}>Get items delivered directly to your home for free on orders above ₹{promotional.freeShippingThreshold}.</p>
                  <div style={{ background: 'var(--color-parchment)', padding: '8px', border: '1px solid var(--color-saffron-light)', borderRadius: '6px', fontWeight: 'bold', display: 'inline-block' }}>AUTO APPLIED</div>
                </div>

                <div style={{ backgroundColor: '#ffffff', border: '1.5px dashed var(--color-saffron)', borderRadius: '12px', padding: 'var(--space-5)', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                  <span style={{ fontSize: '2.5rem' }}>🍯</span>
                  <h3 style={{ color: 'var(--color-forest)', margin: '10px 0' }}>Triphala Deal</h3>
                  <p style={{ fontSize: '0.88rem', margin: '0 0 var(--space-4)' }}>Buy any organic single herb powders and get 15% off coupon automatically.</p>
                  <div style={{ background: 'var(--color-parchment)', padding: '8px', border: '1px solid var(--color-saffron-light)', borderRadius: '6px', fontWeight: 'bold', display: 'inline-block' }}>HERBAL15</div>
                </div>
              </>
            )}
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
