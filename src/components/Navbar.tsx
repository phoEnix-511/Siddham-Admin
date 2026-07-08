import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCart } from '@/context/CartContext';
import CartDrawer from './CartDrawer';
import { useSession } from 'next-auth/react';
import { CONCERN_CATEGORIES, CONCERN_ICONS } from '@/lib/concerns';

interface ProductSuggestion {
  id: string;
  name: string;
  price?: number;
  images?: string[];
  category?: {
    name: string;
    slug: string;
  };
}

const QUICK_CONCERN_COUNT = 6;

export default function Navbar() {
  const router = useRouter();
  const { totalItems, isOpen, openCart, closeCart } = useCart();
  const { data: session } = useSession();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [announcement, setAnnouncement] = useState({ active: false, text: '' });
  const [catalogMode, setCatalogMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [productSuggestions, setProductSuggestions] = useState<ProductSuggestion[]>([]);

  const trimmedSearch = searchVal.trim();
  const normalizedSearch = trimmedSearch.toLowerCase();

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setAnnouncement({
            active: data.settings.announcement_bar_active === 'true',
            text: data.settings.announcement_bar_text || '',
          });
          setCatalogMode(data.settings.catalog_mode === 'true');
        }
      })
      .catch((err) => console.error('Error loading settings in Navbar:', err));
  }, []);

  useEffect(() => {
    if (!searchOpen || trimmedSearch.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      fetch(`/api/products?search=${encodeURIComponent(trimmedSearch)}&limit=6`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data) => setProductSuggestions(data.products || []))
        .catch((error) => {
          if (error?.name !== 'AbortError') {
            setProductSuggestions([]);
          }
        });
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [searchOpen, trimmedSearch]);

  useEffect(() => {
    if (!searchOpen) return;

    const focusTimer = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(focusTimer);
  }, [searchOpen]);

  useEffect(() => {
    const handleRouteChange = () => {
      setSidebarOpen(false);
      setSearchOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
        setSearchOpen(false);
        closeCart();
      }
    };

    router.events.on('routeChangeStart', handleRouteChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeCart, router.events]);

  const concernSuggestions = useMemo(() => {
    if (trimmedSearch.length < 2) {
      return CONCERN_CATEGORIES.slice(0, QUICK_CONCERN_COUNT);
    }

    return CONCERN_CATEGORIES.filter((concern) => {
      const haystack = `${concern.name} ${concern.slug}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    }).slice(0, QUICK_CONCERN_COUNT);
  }, [normalizedSearch, trimmedSearch]);

  const openSidebar = () => {
    closeCart();
    setSearchOpen(false);
    setSidebarOpen((current) => !current);
  };

  const openSearch = () => {
    closeCart();
    setSidebarOpen(false);
    setSearchOpen((current) => !current);
  };

  const closePanels = () => {
    setSidebarOpen(false);
    setSearchOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!trimmedSearch) return;

    closePanels();
    router.push(`/shop?search=${encodeURIComponent(trimmedSearch)}`);
  };

  const handleOpenCart = () => {
    closePanels();
    openCart();
  };

  const isShopRoute = router.pathname === '/shop';
  const currentCategory =
    typeof router.query.category === 'string' ? router.query.category : '';

  return (
    <>
      <header
        className="sticky-header"
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 2147483645,
          width: '100%',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderBottom: '1px solid rgba(13, 44, 29, 0.08)',
        }}
      >
        {announcement.active && announcement.text && (
          <div
            className="announcement-bar"
            style={{
              background: 'var(--color-saffron)',
              color: 'var(--color-forest-dark)',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontSize: '0.75rem',
              padding: '8px',
              textAlign: 'center',
            }}
          >
            {announcement.text}
          </div>
        )}

        <nav
          className="nav"
          role="navigation"
          aria-label="Main navigation"
          style={{ padding: '0 var(--space-4)', maxWidth: '1400px', margin: '0 auto' }}
        >
          <div
            className="nav-inner"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: '84px',
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <button
                type="button"
                className="nav-icon-btn"
                aria-label="Open navigation menu"
                aria-expanded={sidebarOpen}
                aria-haspopup="dialog"
                onClick={openSidebar}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  border: '1px solid rgba(13, 44, 29, 0.12)',
                  background: 'rgba(255,255,255,0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                ☰
              </button>

              <Link
                href="/"
                className="nav-logo"
                aria-label="Siddham Wellness Home"
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}
              >
                <img
                  src="/images/logo.jpg"
                  alt="Siddham Logo"
                  style={{ height: '48px', width: 'auto', borderRadius: '4px', objectFit: 'contain' }}
                />
              </Link>
            </div>

            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minWidth: 0 }}>
              <span
                className="nav-brand-mark"
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: 'var(--color-forest-dark)',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                }}
              >
                Siddham Wellness
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <button
                type="button"
                className="nav-icon-btn"
                aria-label="Open search"
                aria-expanded={searchOpen}
                aria-haspopup="dialog"
                onClick={openSearch}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  border: '1px solid rgba(13, 44, 29, 0.12)',
                  background: 'rgba(255,255,255,0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
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

        <div
          className={`nav-sidebar-backdrop ${(sidebarOpen || searchOpen) ? 'open' : ''}`}
          onClick={closePanels}
        />

        <aside
          className={`nav-sidebar ${sidebarOpen ? 'open' : ''}`}
          aria-label="Sidebar navigation"
          role="dialog"
          aria-modal="true"
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-forest-dark)' }}>
                Browse Concerns
              </div>
              <div style={{ color: 'var(--color-gray-500)', fontSize: '0.82rem' }}>
                Shop by the wellness path that fits you.
              </div>
            </div>
            <button
              type="button"
              onClick={closePanels}
              style={{ border: 'none', background: 'transparent', fontSize: '1.15rem', cursor: 'pointer' }}
              aria-label="Close navigation"
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <Link
              href="/shop"
              onClick={closePanels}
              className="nav-sidebar-link"
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                color: 'var(--color-forest-dark)',
                textDecoration: 'none',
                fontWeight: 700,
                background: isShopRoute && !currentCategory ? 'rgba(196,133,42,0.16)' : 'rgba(13,44,29,0.03)',
                border: '1px solid rgba(13,44,29,0.04)',
              }}
            >
              <span style={{ width: '32px', height: '32px', borderRadius: '9999px', background: 'rgba(255,255,255,0.8)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                🛍️
              </span>
              <span>All Products</span>
            </Link>

            <div style={{ marginTop: 'var(--space-1)', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-gray-500)' }}>
              Concerns
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {CONCERN_CATEGORIES.map((concern) => {
                const isActive = isShopRoute && currentCategory === concern.slug;
                const icon = CONCERN_ICONS[concern.slug] || '🌿';

                return (
                  <Link
                    key={concern.slug}
                    href={`/shop?category=${concern.slug}`}
                    onClick={closePanels}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      color: 'var(--color-forest-dark)',
                      textDecoration: 'none',
                      fontWeight: 600,
                      background: isActive ? 'rgba(196,133,42,0.16)' : 'rgba(13,44,29,0.03)',
                      border: '1px solid rgba(13,44,29,0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <span
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '9999px',
                        background: 'rgba(255,255,255,0.8)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {icon}
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                      <span>{concern.name}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-gray-500)' }}>
                        Shop this concern
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(13,44,29,0.08)', paddingTop: 'var(--space-4)' }}>
            {session ? (
              <Link
                href="/account"
                onClick={closePanels}
                style={{
                  display: 'block',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  color: 'var(--color-forest-dark)',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                My Account
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={closePanels}
                style={{
                  display: 'block',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  color: 'var(--color-forest-dark)',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Login / Register
              </Link>
            )}
          </div>
        </aside>

        <div
          className={`nav-search-drawer ${searchOpen ? 'open' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="Search Siddham"
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', overflowY: 'auto' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-forest-dark)' }}>
                Quick Search
              </div>
              <div style={{ color: 'var(--color-gray-500)', fontSize: '0.82rem' }}>
                Search products or jump straight to a concern.
              </div>
            </div>
            <button
              type="button"
              onClick={closePanels}
              style={{ border: 'none', background: 'transparent', fontSize: '1.1rem', cursor: 'pointer' }}
              aria-label="Close search"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <input
              ref={searchInputRef}
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search products, herbs, or concerns"
              style={{ width: '100%', padding: '12px 14px', borderRadius: '999px', border: '1px solid rgba(13,44,29,0.14)', outline: 'none' }}
              autoComplete="off"
            />
            <button type="submit" className="btn btn-gold" style={{ borderRadius: '999px' }}>
              Search
            </button>
          </form>

          {trimmedSearch.length < 2 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-gray-500)' }}>
                Popular concerns
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'var(--space-2)' }}>
                {CONCERN_CATEGORIES.slice(0, QUICK_CONCERN_COUNT).map((concern) => (
                  <Link
                    key={concern.slug}
                    href={`/shop?category=${concern.slug}`}
                    onClick={closePanels}
                    style={{
                      border: '1px solid rgba(13,44,29,0.08)',
                      borderRadius: '14px',
                      padding: '12px',
                      background: 'rgba(13,44,29,0.03)',
                      color: 'var(--color-forest-dark)',
                      textDecoration: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '8px',
                      minHeight: '92px',
                    }}
                  >
                    <span
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '9999px',
                        background: 'rgba(255,255,255,0.84)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {CONCERN_ICONS[concern.slug] || '🌿'}
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, lineHeight: 1.2 }}>
                      {concern.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-gray-500)' }}>
                  Product matches
                </div>
                {productSuggestions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {productSuggestions.map((item) => (
                      <Link
                        key={item.id}
                        href={`/products/${item.id}`}
                        onClick={closePanels}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-3)',
                          border: '1px solid rgba(13,44,29,0.08)',
                          borderRadius: '14px',
                          padding: '12px 14px',
                          background: 'rgba(13,44,29,0.03)',
                          textDecoration: 'none',
                          color: 'var(--color-forest-dark)',
                        }}
                      >
                        <span
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.92)',
                            border: '1px solid rgba(13,44,29,0.08)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            flexShrink: 0,
                          }}
                        >
                          {item.images?.[0] ? (
                            <img
                              src={item.images[0]}
                              alt={item.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            '🌿'
                          )}
                        </span>
                        <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
                          <span style={{ fontWeight: 700, lineHeight: 1.2 }}>{item.name}</span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--color-gray-500)' }}>
                            {item.category?.name || 'Product'}
                          </span>
                        </span>
                        {typeof item.price === 'number' ? (
                          <span style={{ fontWeight: 800, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                            ₹{item.price}
                          </span>
                        ) : null}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      border: '1px dashed rgba(13,44,29,0.18)',
                      borderRadius: '14px',
                      padding: '16px',
                      background: 'rgba(13,44,29,0.02)',
                      color: 'var(--color-gray-600)',
                      fontSize: '0.9rem',
                    }}
                  >
                    No product matches yet. Try a different term or browse concerns below.
                  </div>
                )}
              </div>

              {concernSuggestions.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-gray-500)' }}>
                    Concern matches
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'var(--space-2)' }}>
                    {concernSuggestions.map((concern) => (
                      <Link
                        key={concern.slug}
                        href={`/shop?category=${concern.slug}`}
                        onClick={closePanels}
                        style={{
                          border: '1px solid rgba(13,44,29,0.08)',
                          borderRadius: '14px',
                          padding: '12px',
                          background: 'rgba(13,44,29,0.03)',
                          color: 'var(--color-forest-dark)',
                          textDecoration: 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          gap: '8px',
                          minHeight: '92px',
                        }}
                      >
                        <span
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '9999px',
                            background: 'rgba(255,255,255,0.84)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {CONCERN_ICONS[concern.slug] || '🌿'}
                        </span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, lineHeight: 1.2 }}>
                          {concern.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  if (!trimmedSearch) return;
                  closePanels();
                  router.push(`/shop?search=${encodeURIComponent(trimmedSearch)}`);
                }}
                className="btn btn-gold"
                style={{ borderRadius: '999px' }}
              >
                View all results for &ldquo;{trimmedSearch}&rdquo;
              </button>
            </>
          )}
        </div>
      </header>

      {isOpen && <CartDrawer onClose={closeCart} />}
    </>
  );
}
