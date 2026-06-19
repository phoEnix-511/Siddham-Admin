import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  comparePrice?: number;
  images: string[];
  stock: number;
  ingredients?: string;
  benefits?: string;
  usage?: string;
  weight?: string;
  videoUrl?: string;
  category: { name: string; slug: string };
}

const CATEGORY_ICONS: Record<string, string> = {
  'hair-care': '💆', 'supplements': '💊', 'skin-care': '✨', 'oils-essentials': '🌿',
};

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { addItem } = useCart();
  const { addToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'description' | 'ingredients' | 'usage' | 'video'>('description');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/products/${id}`)
      .then(r => r.json())
      .then(d => {
        setProduct(d.product);
        setLoading(false);
      });
  }, [id]);

  if (loading) return (
    <>
      <Navbar />
      <div className="loading-page"><div className="spinner" /></div>
    </>
  );

  if (!product) return (
    <>
      <Navbar />
      <div className="empty-state" style={{ minHeight: '60vh' }}>
        <div className="empty-state-icon">🌿</div>
        <h3>Product not found</h3>
        <Link href="/shop" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>Back to Shop</Link>
      </div>
    </>
  );

  const discount = product.comparePrice
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : 0;

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) {
      addItem({ productId: product.id, name: product.name, price: product.price, image: '', stock: product.stock });
    }
    addToast(`${qty}× ${product.name} added to cart`, 'success');
  };

  return (
    <>
      <Head>
        <title>{product.name} – Siddham Wellness</title>
        <meta name="description" content={product.description} />
      </Head>
      <Navbar />

      <section style={{ padding: 'var(--space-10) 0', background: 'var(--color-cream)' }}>
        <div className="container">
          <div className="breadcrumb" style={{ marginBottom: 'var(--space-6)' }}>
            <Link href="/">Home</Link>
            <span className="breadcrumb-sep">/</span>
            <Link href="/shop">Shop</Link>
            <span className="breadcrumb-sep">/</span>
            <Link href={`/shop?category=${product.category.slug}`}>{product.category.name}</Link>
            <span className="breadcrumb-sep">/</span>
            <span>{product.name}</span>
          </div>

          <div className="product-detail-grid">
            {/* Product Image Gallery */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{
                background: 'var(--color-parchment)',
                borderRadius: 'var(--radius-2xl)',
                aspectRatio: '1',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid var(--color-gray-100)',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {product.images && product.images.length > 0 && product.images[activeImageIdx] ? (
                  <img
                    src={product.images[activeImageIdx]}
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      const parent = (e.target as HTMLImageElement).parentElement;
                      const fallback = parent?.querySelector('.detail-fallback-placeholder');
                      if (fallback) (fallback as HTMLElement).style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="detail-fallback-placeholder"
                  style={{
                    display: product.images && product.images.length > 0 && product.images[activeImageIdx] ? 'none' : 'flex',
                    fontSize: '8rem'
                  }}
                >
                  {CATEGORY_ICONS[product.category.slug] || '🌿'}
                </div>
              </div>

              {/* Thumbnails */}
              {product.images && product.images.length > 1 && (
                <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIdx(idx)}
                      style={{
                        width: 70, height: 70,
                        border: activeImageIdx === idx ? '2.5px solid var(--color-saffron)' : '1px solid var(--color-gray-200)',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        padding: 0,
                        background: 'var(--color-parchment)',
                        cursor: 'pointer',
                        boxShadow: activeImageIdx === idx ? 'var(--shadow-glow)' : 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpolyline points="21 15 16 10 5 21"%3E%3C/polyline%3E%3C/svg%3E';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div>
              <div className="product-category-tag" style={{ fontSize: '0.8rem', marginBottom: 'var(--space-2)' }}>
                {product.category.name}
              </div>
              <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', marginBottom: 'var(--space-4)', color: 'var(--color-forest-dark)' }}>
                {product.name}
              </h1>

              {product.weight && (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>⚖️</span> {product.weight}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 700, color: 'var(--color-forest)' }}>
                  ₹{product.price}
                </span>
                {product.comparePrice && (
                  <span style={{ fontSize: '1.1rem', color: 'var(--color-gray-400)', textDecoration: 'line-through' }}>
                    ₹{product.comparePrice}
                  </span>
                )}
                {discount > 0 && (
                  <span className="badge badge-gold">{discount}% OFF</span>
                )}
              </div>

              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: product.stock === 0 ? 'var(--color-error-bg)' : product.stock <= 10 ? 'var(--color-warning-bg)' : 'var(--color-success-bg)',
                color: product.stock === 0 ? 'var(--color-error)' : product.stock <= 10 ? 'var(--color-warning)' : 'var(--color-success)',
                borderRadius: 'var(--radius-full)', padding: '4px 12px', fontSize: '0.75rem', fontWeight: 700,
                marginBottom: 'var(--space-6)',
              }}>
                {product.stock === 0 ? '❌ Out of Stock' : product.stock <= 10 ? `⚠️ Only ${product.stock} left` : '✅ In Stock'}
              </div>

              {product.stock > 0 && (
                <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <button className="qty-btn" style={{ width: 36, height: 36 }} onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem', minWidth: 32, textAlign: 'center' }}>{qty}</span>
                    <button className="qty-btn" style={{ width: 36, height: 36 }} onClick={() => setQty(Math.min(product.stock, qty + 1))}>+</button>
                  </div>
                  <button
                    id="add-to-cart-btn"
                    className="btn btn-gold btn-lg"
                    onClick={handleAddToCart}
                    style={{ flex: 1 }}
                  >
                    🛒 Add to Cart
                  </button>
                </div>
              )}

              <div style={{ background: 'var(--color-parchment)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <div className="grid-2">
                  {[
                    { icon: '🚚', text: 'Free shipping on ₹999+' },
                    { icon: '🔄', text: '30-day easy returns' },
                    { icon: '🔒', text: 'Secure payments' },
                    { icon: '🌿', text: '100% natural ingredients' },
                  ].map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--color-forest)' }}>
                      <span>{f.icon}</span>{f.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          {(() => {
            const tabs: { id: 'description' | 'ingredients' | 'usage' | 'video'; label: string }[] = [
              { id: 'description', label: 'Description' }
            ];
            if (product.ingredients || product.benefits) {
              tabs.push({ id: 'ingredients', label: 'Ingredients' });
            }
            if (product.usage) {
              tabs.push({ id: 'usage', label: 'Usage Instructions' });
            }
            if (product.videoUrl) {
              tabs.push({ id: 'video', label: 'Video Demo' });
            }

            return (
              <div style={{ marginTop: 'var(--space-12)' }}>
                <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--color-gray-200)', marginBottom: 'var(--space-6)' }}>
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        padding: 'var(--space-3) var(--space-6)',
                        fontWeight: 600, fontSize: '0.875rem',
                        color: activeTab === tab.id ? 'var(--color-forest)' : 'var(--color-gray-500)',
                        borderBottom: activeTab === tab.id ? '2px solid var(--color-saffron)' : '2px solid transparent',
                        marginBottom: -2, transition: 'all 0.2s', cursor: 'pointer',
                        background: 'none',
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div style={{ maxWidth: 760 }}>
                  {activeTab === 'description' && (
                    <p style={{ lineHeight: 1.9, color: 'var(--color-gray-700)' }}>{product.description}</p>
                  )}
                  {activeTab === 'ingredients' && (product.ingredients || product.benefits) && (
                    <div>
                      {product.ingredients && (
                        <p style={{ lineHeight: 1.9, color: 'var(--color-gray-700)', marginBottom: 'var(--space-4)' }}>
                          {product.ingredients}
                        </p>
                      )}
                      {product.benefits && (
                        <>
                          <h4 style={{ color: 'var(--color-forest-dark)', marginBottom: 'var(--space-3)' }}>Key Benefits</h4>
                          <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                            {product.benefits.split(',').map((b, i) => (
                              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', color: 'var(--color-gray-700)' }}>
                                <span style={{ color: 'var(--color-saffron)', fontWeight: 700 }}>✦</span>
                                {b.trim()}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  )}
                  {activeTab === 'usage' && product.usage && (
                    <p style={{ lineHeight: 1.9, color: 'var(--color-gray-700)' }}>{product.usage}</p>
                  )}
                  {activeTab === 'video' && product.videoUrl && (
                    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', background: '#000' }}>
                      {(() => {
                        const getYouTubeEmbedId = (url?: string) => {
                          if (!url) return null;
                          const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                          const match = url.match(regExp);
                          return (match && match[2].length === 11) ? match[2] : null;
                        };
                        const embedId = getYouTubeEmbedId(product.videoUrl);
                        if (embedId) {
                          return (
                            <iframe
                              src={`https://www.youtube.com/embed/${embedId}`}
                              title={`${product.name} Video Demonstration`}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                            />
                          );
                        }
                        return (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-parchment-dark)', color: 'var(--color-gray-500)' }}>
                            Invalid video link: {product.videoUrl}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      <Footer />
    </>
  );
}
