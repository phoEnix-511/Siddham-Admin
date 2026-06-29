import React from 'react';
import { GetServerSideProps } from 'next';
import { prisma } from '@/lib/prisma';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const products = await prisma.product.findMany({
      where: { isFeatured: true },
      take: 10
    });

    const categories = await prisma.category.findMany();

    const settingsRecords = await prisma.setting.findMany();
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
        }
      }
    };
  } catch (error) {
    console.error('Error in index getServerSideProps:', error);
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
        }
      }
    };
  }
};

export default function Home({ featuredProducts, categories, hero, promotional }: { featuredProducts: any[], categories: any[], hero: any, promotional: any }) {
  // Mock Concerns
  const concerns = [
    { name: 'Hair Fall', icon: '💆‍♀️', slug: 'hair-care' },
    { name: 'Dandruff', icon: '❄️', slug: 'hair-care' },
    { name: 'Glowing Skin', icon: '✨', slug: 'skin-care' },
    { name: 'Immunity', icon: '🛡️', slug: 'supplements' },
    { name: 'Stress Relief', icon: '🧘', slug: 'oils-essentials' },
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
            <span>Free Shipping on orders over ₹999</span>
            <span>🌿 100% Natural Ayurvedic Ingredients</span>
            <span>Free Shipping on orders over ₹999</span>
            <span>🌿 100% Natural Ayurvedic Ingredients</span>
            <span>Free Shipping on orders over ₹999</span>
            <span>🌿 100% Natural Ayurvedic Ingredients</span>
          </div>
        </div>
      </div>

      <Navbar />

      {/* 2. Multi-List Quick Links (Circular Categories) */}
      <div className="multi-list-links">
        <div className="container" style={{ padding: 0 }}>
          <div className="multi-list-scroll">
            <Link href="/shop" className="multi-list-item">
              <div className="multi-list-image-wrap">
                <div style={{ fontSize: '2rem' }}>🌿</div>
              </div>
              <span className="multi-list-label">All<br/>Products</span>
            </Link>
            {categories.map((cat, i) => {
              // Map index to a specific image
              const imgSrc = i % 3 === 0 ? '/images/hair-oil.png' : i % 3 === 1 ? '/images/supplements.png' : '/images/skincare.png';
              return (
                <Link key={cat.id} href={`/shop?category=${cat.slug}`} className="multi-list-item">
                  <div className="multi-list-image-wrap">
                    <img src={imgSrc} alt={cat.name} loading="lazy" />
                  </div>
                  <span className="multi-list-label">{cat.name.replace(' ', '\n')}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Hero Slideshow (Static full width for now, scroll snap if multiple) */}
      <section className="hero-slideshow" style={{ width: '100%', overflowX: 'auto', display: 'flex', scrollSnapType: 'x mandatory' }}>
        <div style={{ 
          minWidth: '100%', 
          height: '60vh', 
          minHeight: '400px',
          scrollSnapAlign: 'start',
          backgroundImage: `linear-gradient(rgba(15,35,24,0.4), rgba(15,35,24,0.8)), url(${hero.image || 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=2053'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
          padding: 'var(--space-6)'
        }}>
          <div>
            <h1 style={{ color: 'var(--color-cream)', fontSize: 'clamp(2rem, 5vw, 4rem)', marginBottom: 'var(--space-3)' }}>{hero.title}</h1>
            <p style={{ color: 'var(--color-saffron-pale)', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto var(--space-5)' }}>{hero.subtitle}</p>
            <Link href="/shop" className="btn btn-gold btn-lg">Explore Collection</Link>
          </div>
        </div>
      </section>

      {/* 4. Trust Bar */}
      <div className="trust-bar">
        <span className="trust-stars">★★★★★</span>
        <span className="trust-bar-text">Rated 4.8 by 50,000+ Customers</span>
        <span className="trust-stars">★★★★★</span>
      </div>

      {/* 5. Curated Specially For You (Product Slider) */}
      <section className="section">
        <div className="container">
          <h2 className="vasu-section-title">
            Curated Specially For You! 
            <Link href="/shop">View all</Link>
          </h2>
          <div className="vasu-slider">
            {featuredProducts.slice(0, 6).map(p => (
              <div key={p.id} className="vasu-slide product">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Shop by Category (Grid) */}
      <section className="section" style={{ background: 'var(--color-cream)' }}>
        <div className="container">
          <h2 className="vasu-section-title" style={{ justifyContent: 'center' }}>Shop by Category</h2>
          <div className="category-grid">
            {categories.slice(0, 4).map((cat, idx) => {
              const imgSrc = idx % 3 === 0 ? '/images/skincare.png' : idx % 3 === 1 ? '/images/supplements.png' : '/images/hair-oil.png';
              return (
                <Link href={`/shop?category=${cat.slug}`} key={cat.id} className="category-card">
                  <img src={imgSrc} alt={cat.name} loading="lazy" />
                  <div className="category-card-overlay">{cat.name}</div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Featured Collections (Product Slider) */}
      <section className="section">
        <div className="container">
          <h2 className="vasu-section-title">
            Featured Collections
            <Link href="/shop?featured=true">View all</Link>
          </h2>
          <div className="vasu-slider">
            {featuredProducts.slice(2, 8).map(p => (
              <div key={p.id} className="vasu-slide product">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Promotional Banner Image */}
      <section className="section-sm">
        <div className="container">
          <div className="vasu-promo-banner">
            <div style={{ position: 'relative', zIndex: 2 }}>
              <h2 style={{ color: 'white', marginBottom: 'var(--space-2)' }}>Build Your Own Wellness Bundle</h2>
              <p style={{ fontSize: '1.1rem', marginBottom: 'var(--space-4)' }}>Pick any 3 products and save 25% instantly.</p>
              <Link href="/bundles" className="btn btn-gold">Build Now</Link>
            </div>
            {/* Background design elements */}
            <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '40%', height: '200%', background: 'rgba(196,133,42,0.1)', transform: 'rotate(15deg)' }} />
          </div>
        </div>
      </section>

      {/* 9. Shop by Concern */}
      <section className="section" style={{ background: 'var(--color-parchment)' }}>
        <div className="container">
          <h2 className="vasu-section-title" style={{ justifyContent: 'center' }}>Shop by Concern</h2>
          <div className="multi-list-scroll" style={{ padding: '0', justifyContent: 'center' }}>
            {concerns.map(c => (
              <Link key={c.name} href={`/shop?category=${c.slug}`} className="multi-list-item" style={{ minWidth: 100 }}>
                <div className="multi-list-image-wrap" style={{ width: 90, height: 90, borderRadius: 16 }}>
                  <div style={{ fontSize: '2.5rem' }}>{c.icon}</div>
                </div>
                <span className="multi-list-label">{c.name}</span>
              </Link>
            ))}
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