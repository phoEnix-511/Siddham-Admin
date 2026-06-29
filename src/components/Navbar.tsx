import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCart } from '@/context/CartContext';
import CartDrawer from './CartDrawer';
import { useSession } from 'next-auth/react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export default function Navbar() {
  const router = useRouter();
  const { totalItems, isOpen, openCart, closeCart } = useCart();
  const [announcement, setAnnouncement] = useState({ active: false, text: '' });
  const [categories, setCategories] = useState<Category[]>([]);
  const { data: session } = useSession();

  useEffect(() => {
    // Load announcement settings
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setAnnouncement({
            active: data.settings.announcement_bar_active === 'true',
            text: data.settings.announcement_bar_text || '',
          });
        }
      })
      .catch(err => console.error('Error loading settings in Navbar:', err));

    // Load dynamic categories
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.categories) {
          setCategories(data.categories);
        }
      })
      .catch(err => console.error('Error loading categories in Navbar:', err));
  }, []);

  return (
    <>
      <header className="sticky-header" style={{ position: 'sticky', top: 0, zIndex: 1000, width: '100%', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', backgroundColor: 'rgba(255, 255, 255, 0.8)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        {/* Dynamic Announcement Bar */}
        {announcement.active && announcement.text && (
          <div className="announcement-bar" style={{ background: 'var(--color-saffron)', color: 'var(--color-forest-dark)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem', padding: '8px', textAlign: 'center' }}>
            {announcement.text}
          </div>
        )}

        <nav className="nav" role="navigation" aria-label="Main navigation" style={{ padding: '0 var(--space-6)', maxWidth: '1400px', margin: '0 auto' }}>
          <div className="nav-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '80px' }}>
            <Link href="/" className="nav-logo" aria-label="Siddham Wellness Home" style={{ textDecoration: 'none' }}>
              <span className="nav-logo-name" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-forest-dark)', letterSpacing: '-0.02em' }}>Siddham.</span>
            </Link>

            <div className="nav-links" style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'center' }}>
              <Link href="/" className={`nav-link ${router.pathname === '/' ? 'active' : ''}`}>
                Home
              </Link>

              {/* Shop Mega Menu Link container */}
              <div className="nav-link-container">
                <Link href="/shop" className={`nav-link ${router.pathname.startsWith('/shop') ? 'active' : ''}`}>
                  Shop <span style={{ fontSize: '0.7rem', marginLeft: 2 }}>▼</span>
                </Link>
                <div className="mega-menu">
                  <div className="mega-menu-col">
                    <h4 className="mega-menu-title">Product Categories</h4>
                    <div className="mega-menu-list">
                      <Link href="/shop" className="mega-menu-item">
                        All Products
                      </Link>
                      {categories.map(c => (
                        <Link key={c.id} href={`/shop?category=${c.slug}`} className="mega-menu-item">
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div className="mega-menu-col highlight-col">
                    <h4 className="mega-menu-title">Siddham Philosophy</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-gray-600)', lineHeight: 1.5, margin: 0 }}>
                      Handcrafted Ayurvedic tonics and wellness formulations rooted in ancient scriptures, prepared with organic forest herbs, and validated by modern science.
                    </p>
                    <div style={{ marginTop: 'var(--space-3)', display: 'flex', gap: 'var(--space-2)' }}>
                      <span style={{ fontSize: '1.2rem' }}>🌿</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-forest)', alignSelf: 'center' }}>
                        100% Pure & Organic
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Link href="/about" className={`nav-link ${router.pathname === '/about' ? 'active' : ''}`}>
                Our Story
              </Link>
            </div>

            <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              {session ? (
                <Link href="/account" className="btn btn-outline" style={{ borderRadius: '9999px', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                  Account
                </Link>
              ) : (
                <Link href="/login" className="btn btn-outline" style={{ borderRadius: '9999px', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                  Login
                </Link>
              )}
              <button
                id="cart-btn"
                className="btn btn-gold"
                onClick={openCart}
                aria-label={`Open cart, ${totalItems} items`}
                style={{ borderRadius: '9999px', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <span style={{ fontSize: '1.1rem' }}>🛍️</span>
                <span>{totalItems}</span>
              </button>
            </div>
          </div>
        </nav>
      </header>

      {isOpen && <CartDrawer onClose={closeCart} />}
    </>
  );
}
