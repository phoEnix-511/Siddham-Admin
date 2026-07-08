import React, { useEffect, useState, useMemo } from 'react';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const { data: session } = useSession();

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

  useEffect(() => {
    if (searchVal.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timeout = window.setTimeout(() => {
      fetch(`/api/products?search=${encodeURIComponent(searchVal.trim())}&limit=6`)
        .then((res) => res.json())
        .then((data) => setSuggestions(data.products || []))
        .catch(() => setSuggestions([]));
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [searchVal]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      setSearchOpen(false);
      router.push(`/shop?search=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const handleOpenCart = () => {
    setSearchOpen(false);
    openCart();
  };

  const quickLinks = useMemo(() => [
    { label: 'All Products', href: '/shop' },
    { label: 'Hair Care', href: '/shop?category=hair-wellness' },
    { label: 'Skin Care', href: '/shop?category=skin-wellness' },
    { label: 'Digestive Wellness', href: '/shop?category=digestive-wellness' },
    { label: 'Immunity', href: '/shop?category=immunity-wellness' },
  ], []);

  const navLinks = [
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
      <header className="sticky-header" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2147483646, width: '100%', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', backgroundColor: 'rgba(255, 255, 255, 0.95)', borderBottom: '1px solid rgba(13, 44, 29, 0.08)' }}>
        {/* Dynamic Announcement Bar */}
        {announcement.active && announcement.text && (
          <div className="announcement-bar" style={{ background: 'var(--color-saffron)', color: 'var(--color-forest-dark)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem', padding: '8px', textAlign: 'center' }}>
            {announcement.text}
          </div>
        )}

        <nav className="nav" role="navigation" aria-label="Main navigation" style={{ padding: '0 var(--space-4)', maxWidth: '1400px', margin: '0 auto' }}>
          <div className="nav-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '84px', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <button
                type="button"
                className="nav-icon-btn"
                aria-label="Open navigation menu"
                onClick={() => setSidebarOpen(true)}
                style={{ width: 42, height: 42, borderRadius: '50%', border: '1px solid rgba(13, 44, 29, 0.12)', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                ☰
              </button>

              <Link href="/" className="nav-logo" aria-label="Siddham Wellness Home" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <img src="/images/logo.jpg" alt="Siddham Logo" style={{ height: '48px', width: 'auto', borderRadius: '4px', objectFit: 'contain' }} />
              </Link>
            </div>

            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minWidth: 0 }}>
              <span className="nav-brand-mark" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-forest-dark)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>Siddham Wellness</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <button
                type="button"
                className="nav-icon-btn"
                aria-label="Open search"
                onClick={() => setSearchOpen(true)}
                style={{ width: 42, height: 42, borderRadius: '50%', border: '1px solid rgba(13, 44, 29, 0.12)', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                🔍
              </button>
              {!catalogMode ? (
                <button
                  id="cart-btn"
                  className="btn btn-gold top-cart-btn"
                  onClick={handleOpenCart}
                  aria-label={`Open cart, ${totalItems} items`}
                  style={{ borderRadius: '9999px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span style={{ fontSize: '1rem' }}>🛍️</span>
                  <span>{totalItems}</span>
                </button>
              ) : null}
            </div>
          </div>
        </nav>

        <div className={`nav-sidebar-backdrop ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
        <aside className={`nav-sidebar ${sidebarOpen ? 'open' : ''}`} aria-label="Sidebar navigation">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-forest-dark)' }}>Explore Siddham</div>
            <button type="button" onClick={() => setSidebarOpen(false)} style={{ border: 'none', background: 'transparent', fontSize: '1.15rem', cursor: 'pointer' }} aria-label="Close navigation">✕</button>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setSidebarOpen(false)} style={{ padding: '10px 12px', borderRadius: '10px', color: 'var(--color-forest-dark)', textDecoration: 'none', fontWeight: 600, background: router.asPath === link.href ? 'rgba(196,133,42,0.16)' : 'transparent' }}>
                {link.label}
              </Link>
            ))}
            <div style={{ marginTop: 'var(--space-4)', borderTop: '1px solid rgba(13,44,29,0.08)', paddingTop: 'var(--space-4)' }}>
              {session ? (
                <Link href="/account" onClick={() => setSidebarOpen(false)} style={{ display: 'block', padding: '10px 12px', borderRadius: '10px', color: 'var(--color-forest-dark)', textDecoration: 'none', fontWeight: 600 }}>
                  My Account
                </Link>
              ) : (
                <Link href="/login" onClick={() => setSidebarOpen(false)} style={{ display: 'block', padding: '10px 12px', borderRadius: '10px', color: 'var(--color-forest-dark)', textDecoration: 'none', fontWeight: 600 }}>
                  Login / Register
                </Link>
              )}
            </div>
          </nav>
        </aside>

        <div className={`nav-search-drawer ${searchOpen ? 'open' : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-forest-dark)' }}>Search Siddham</div>
            <button type="button" onClick={() => setSearchOpen(false)} style={{ border: 'none', background: 'transparent', fontSize: '1.1rem', cursor: 'pointer' }} aria-label="Close search">✕</button>
          </div>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <input
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search products or concerns"
              style={{ width: '100%', padding: '12px 14px', borderRadius: '999px', border: '1px solid rgba(13,44,29,0.14)', outline: 'none' }}
            />
            <button type="submit" className="btn btn-gold" style={{ borderRadius: '999px' }}>Search</button>
          </form>
          {suggestions.length > 0 && (
            <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {suggestions.map((item) => (
                <button key={item.id} type="button" onClick={() => { setSearchOpen(false); router.push(`/shop?search=${encodeURIComponent(item.name)}`); }} style={{ textAlign: 'left', border: 'none', background: 'rgba(13,44,29,0.03)', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', color: 'var(--color-forest-dark)' }}>
                  {item.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {isOpen && <CartDrawer onClose={closeCart} />}
    </>
  );
}
