import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCart } from '@/context/CartContext';
import CartDrawer from './CartDrawer';

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
      <header className="sticky-header" style={{ position: 'sticky', top: 0, zIndex: 1000, width: '100%' }}>
        {/* Dynamic Announcement Bar */}
        {announcement.active && announcement.text && (
          <div className="announcement-bar">
            {announcement.text}
          </div>
        )}

        <nav className="nav" role="navigation" aria-label="Main navigation">
          <div className="nav-inner">
            <Link href="/" className="nav-logo" aria-label="Siddham Wellness Home">
              <span className="nav-logo-name">Siddham Wellness</span>
              <span className="nav-logo-tagline">Ancient Wisdom · Modern Wellness</span>
            </Link>

            <div className="nav-links">
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

            <div className="nav-actions">
              <button
                id="cart-btn"
                className="nav-cart-btn"
                onClick={openCart}
                aria-label={`Open cart, ${totalItems} items`}
              >
                <span>🛒</span>
                <span>Cart</span>
                {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {isOpen && <CartDrawer onClose={closeCart} />}
    </>
  );
}
