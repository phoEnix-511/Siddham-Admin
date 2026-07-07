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
  const [catalogMode, setCatalogMode] = useState(false);
  const { data: session } = useSession();

  // Search input state
  const [searchVal, setSearchVal] = useState('');

  useEffect(() => {
    // Load announcement and catalog settings
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setAnnouncement({
            active: data.settings.announcement_bar_active === 'true',
            text: data.settings.announcement_bar_text || '',
          });
          setCatalogMode(data.settings.catalog_mode === 'true');
        }
      })
      .catch(err => console.error('Error loading settings in Navbar:', err));
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  // Static navbar link definitions as requested
  const topNavLinks = [
    { label: "All products", href: "/shop" },
    { label: "Single herb powders", href: "/shop?category=single-herb-powders" },
    { label: "Single herb tablets", href: "/shop?category=single-herb-tablets" },
    { label: "Hair Care", href: "/shop?category=hair-care" },
    { label: "Skin Care", href: "/shop?category=skin-care" },
    { label: "Digestive wellness", href: "/shop?category=digestive-wellness" },
    { label: "Combos", href: "/shop?category=combos" }
  ];

  return (
    <>
      <header className="sticky-header" style={{ position: 'sticky', top: 0, zIndex: 1000, width: '100%', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', backgroundColor: 'rgba(255, 255, 255, 0.95)', borderBottom: '1px solid rgba(13, 44, 29, 0.08)' }}>
        {/* Dynamic Announcement Bar */}
        {announcement.active && announcement.text && (
          <div className="announcement-bar" style={{ background: 'var(--color-saffron)', color: 'var(--color-forest-dark)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem', padding: '8px', textAlign: 'center' }}>
            {announcement.text}
          </div>
        )}

        {/* Top Header Row with Logo, Search Bar, and Actions */}
        <nav className="nav" role="navigation" aria-label="Main navigation" style={{ padding: '0 var(--space-6)', maxWidth: '1400px', margin: '0 auto' }}>
          <div className="nav-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '85px', gap: 'var(--space-4)' }}>
            
            {/* Branded Logo Image - Clicking it leads to homepage */}
            <Link href="/" className="nav-logo" aria-label="Siddham Wellness Home" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <img 
                src="/images/logo.jpg" 
                alt="Siddham Logo" 
                style={{ height: '55px', width: 'auto', borderRadius: '4px', objectFit: 'contain' }} 
              />
              <span className="nav-logo-name" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-forest-dark)', letterSpacing: '-0.02em', display: 'none' }}>Siddham.</span>
            </Link>

            {/* Central Search Bar */}
            <form onSubmit={handleSearchSubmit} className="nav-search-form" style={{ flex: 1, maxWidth: '500px', position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="What are you looking for?"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 45px 10px 18px',
                  borderRadius: '9999px',
                  border: '1.5px solid rgba(13, 44, 29, 0.15)',
                  outline: 'none',
                  fontSize: '0.9rem',
                  fontFamily: 'var(--font-sans)',
                  transition: 'border-color 0.2s',
                  backgroundColor: 'rgba(13, 44, 29, 0.02)'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-saffron)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(13, 44, 29, 0.15)'}
              />
              <button 
                type="submit" 
                style={{
                  position: 'absolute',
                  right: '15px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  padding: 0
                }}
                aria-label="Submit search query"
              >
                🔍
              </button>
            </form>

            {/* Right side User/Cart Actions */}
            {!catalogMode ? (
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
                  className="btn btn-gold top-cart-btn"
                  onClick={openCart}
                  aria-label={`Open cart, ${totalItems} items`}
                  style={{ borderRadius: '9999px', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span style={{ fontSize: '1.1rem' }}>🛍️</span>
                  <span>{totalItems}</span>
                </button>
              </div>
            ) : (
              // Empty space placeholder to balance grid layout in catalogMode
              <div style={{ width: '40px' }} />
            )}
          </div>
        </nav>

        {/* Bottom TopNav Link Strip */}
        {/* <div style={{ borderTop: '1px solid rgba(13, 44, 29, 0.05)', backgroundColor: 'var(--color-cream)' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '10px var(--space-6)', overflowX: 'auto', display: 'flex', gap: 'var(--space-6)', justifyContent: 'center', alignItems: 'center', whiteSpace: 'nowrap' }}>
            {topNavLinks.map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                className={`nav-link ${router.asPath === link.href ? 'active' : ''}`}
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--color-forest)',
                  textDecoration: 'none',
                  padding: '2px 0',
                  transition: 'color 0.2s'
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div> */}
      </header>

      {isOpen && <CartDrawer onClose={closeCart} />}
    </>
  );
}
