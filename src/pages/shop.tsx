import React, { useEffect, useState, useCallback } from 'react';
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

function SkeletonCard() {
  return (
    <div className="product-card-skeleton">
      <div className="skeleton-image" />
      <div className="skeleton-body">
        <div className="skeleton-line short" />
        <div className="skeleton-line medium" />
        <div className="skeleton-line tall" />
      </div>
    </div>
  );
}

export default function ShopPage() {
  const router = useRouter();
  const { addItem } = useCart();
  const { addToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState(''); // separate controlled input
  const [activeCategory, setActiveCategory] = useState('');
  const [priceLimit, setPriceLimit] = useState(2000);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [sort, setSort] = useState('newest');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  const fetchProducts = useCallback(async (cat = '', q = '', page = 1, maxP = 2000, sortOption = 'newest') => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '12' });
    if (cat) params.set('category', cat);
    if (q) params.set('search', q);
    if (maxP < 2000) params.set('maxPrice', String(maxP));
    if (sortOption) params.set('sort', sortOption);
    try {
      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(d => setCategories(d.categories || []));
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    const cat = (router.query.category as string) || '';
    setActiveCategory(cat);
    fetchProducts(cat, search, 1, priceLimit, sort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query.category]);

  // Auto-suggestions with debounce
  useEffect(() => {
    if (searchInput.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/products?search=${encodeURIComponent(searchInput)}&limit=6`)
        .then(res => res.json())
        .then(data => { if (data.products) setSuggestions(data.products); })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Price range update with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(activeCategory, search, 1, priceLimit, sort);
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceLimit, sort]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setShowSuggestions(false);
    fetchProducts(activeCategory, searchInput, 1, priceLimit, sort);
  };

  const handleCategoryFilter = (slug: string) => {
    setActiveCategory(slug);
    fetchProducts(slug, search, 1, priceLimit, sort);
    router.push(slug ? `/shop?category=${slug}` : '/shop', undefined, { shallow: true });
  };

  const discount = (price: number, comparePrice?: number) =>
    comparePrice ? Math.round((1 - price / comparePrice) * 100) : 0;

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    if (product.stock === 0 || addingToCart === product.id) return;
    setAddingToCart(product.id);
    addItem({ productId: product.id, name: product.name, price: product.price, image: product.images?.[0] || '', stock: product.stock });
    addToast(`${product.name} added to cart ✓`, 'success');
    setTimeout(() => setAddingToCart(null), 1000);
  };

  return (
    <>
      <Head>
        <title>Shop – Siddham Wellness</title>
        <meta name="description" content="Browse Siddham Wellness's complete range of Ayurvedic hair care, supplements, skin care, and essential oils." />
      </Head>
      <Navbar />

      <div className="page-header">
        <div className="container">
          <h1>Our Products</h1>
          <p>Discover the healing power of Ayurveda</p>
          <div className="breadcrumb" style={{ justifyContent: 'center', marginTop: 'var(--space-3)' }}>
            <Link href="/">Home</Link>
            <span className="breadcrumb-sep">/</span>
            <span>Shop</span>
            {activeCategory && <><span className="breadcrumb-sep">/</span><span style={{ textTransform: 'capitalize' }}>{activeCategory.replace(/-/g, ' ')}</span></>}
          </div>
        </div>
      </div>

      <section className="section-sm">
        <div className="container">
          {/* Search + Filter Panel */}
          <div className="filter-bar" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', alignItems: 'stretch' }}>
            {/* Top row: search + mobile filter toggle */}
            <div className="shop-top-row" style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Search Form with Auto-Suggest */}
              <form onSubmit={handleSearch} className="search-form-wrapper" style={{ display: 'flex', gap: 'var(--space-2)', flex: 1, position: 'relative', minWidth: 280 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    id="search-input"
                    className="form-input"
                    placeholder="Search products..."
                    value={searchInput}
                    onChange={e => {
                      setSearchInput(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onFocus={() => searchInput.length >= 2 && setShowSuggestions(true)}
                    style={{ width: '100%', paddingRight: 'var(--space-3)' }}
                    autoComplete="off"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="suggestions-dropdown">
                      {suggestions.map(p => (
                        <div
                          key={p.id}
                          className="suggestion-item"
                          onMouseDown={() => {
                            setSearchInput(p.name);
                            setSearch(p.name);
                            setShowSuggestions(false);
                            fetchProducts(activeCategory, p.name, 1, priceLimit, sort);
                          }}
                        >
                          🌿 {p.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ whiteSpace: 'nowrap', flexShrink: 0, padding: '0 var(--space-5)' }}
                >
                  🔍 Search
                </button>
              </form>

              <button
                type="button"
                className="btn btn-outline mobile-filter-toggle"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
              >
                ⚙️ Filters {showMobileFilters ? '▲' : '▼'}
              </button>
            </div>

            <div className={`filter-options-container ${showMobileFilters ? 'mobile-visible' : 'mobile-hidden'}`}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 'var(--space-4)', alignItems: 'center' }}>
                {/* Price Range Slider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 250, flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-forest)', whiteSpace: 'nowrap' }} htmlFor="price-slider">
                    Max Price: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>₹{priceLimit}</span>
                  </label>
                  <input
                    id="price-slider"
                    type="range"
                    min="0"
                    max="2000"
                    step="50"
                    value={priceLimit}
                    onChange={e => setPriceLimit(Number(e.target.value))}
                    style={{ flex: 1, accentColor: 'var(--color-forest)', height: 6, borderRadius: 3, cursor: 'pointer' }}
                  />
                </div>

                {/* Sort Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-forest)' }} htmlFor="sort-select">
                    Sort By:
                  </label>
                  <select
                    id="sort-select"
                    className="form-input"
                    style={{ padding: '0.25rem 0.5rem', width: 'auto' }}
                    value={sort}
                    onChange={e => setSort(e.target.value)}
                  >
                    <option value="popular">Popularity</option>
                    <option value="newest">Newly Added</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="name_asc">Name</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', borderTop: '1px solid rgba(13,44,29,0.06)', paddingTop: 'var(--space-3)' }}>
              <button
                className={`filter-chip ${activeCategory === '' ? 'active' : ''}`}
                onClick={() => handleCategoryFilter('')}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`filter-chip ${activeCategory === cat.slug ? 'active' : ''}`}
                  onClick={() => handleCategoryFilter(cat.slug)}
                >
                  {CATEGORY_ICONS[cat.slug] || '🌿'} {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 'var(--space-5)', color: 'var(--color-gray-500)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {!loading && (
              <>
                <span>{pagination.total} product{pagination.total !== 1 ? 's' : ''} found</span>
                {search && <span style={{ background: 'var(--color-gray-100)', padding: '2px 10px', borderRadius: '99px', fontSize: '0.78rem' }}>for &ldquo;{search}&rdquo; <button onClick={() => { setSearch(''); setSearchInput(''); fetchProducts(activeCategory, '', 1, priceLimit, sort); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-error)', fontWeight: 700, marginLeft: 4 }}>✕</button></span>}
              </>
            )}
          </div>

          {loading ? (
            <div className="product-grid">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🌿</div>
              <h3>No products found</h3>
              <p>Try a different search or category</p>
              <button className="btn btn-outline" style={{ marginTop: 'var(--space-4)' }} onClick={() => { setSearch(''); setSearchInput(''); setActiveCategory(''); fetchProducts('', '', 1, 2000, sort); }}>Clear filters</button>
            </div>
          ) : (
            <div className="product-grid">
              {products.map(product => {
                const disc = discount(product.price, product.comparePrice);
                const isAdding = addingToCart === product.id;
                return (
                  <div className="product-card" key={product.id}>
                    <Link href={`/products/${product.id}`}>
                      <div className="product-card-image">
                        {product.images && product.images.length > 0 && product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            loading="lazy"
                            decoding="async"
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
                          style={{ display: product.images && product.images.length > 0 && product.images[0] ? 'none' : 'flex' }}
                        >
                          {CATEGORY_ICONS[product.category.slug] || '🌿'}
                        </div>
                        {disc > 0 && <span className="product-card-badge">{disc}% OFF</span>}
                        {product.stock <= 10 && product.stock > 0 && (
                          <span className="product-card-badge" style={{ left: 'auto', right: 'var(--space-3)', background: 'var(--color-bark)' }}>
                            Low Stock
                          </span>
                        )}
                        <div className="product-card-actions">
                          {product.variants && product.variants.length > 0 ? (
                            <button
                              type="button"
                              className="btn btn-gold"
                              style={{ width: '100%', borderRadius: 8 }}
                              onClick={e => { e.preventDefault(); router.push(`/products/${product.id}`); }}
                            >
                              🔍 View Options
                            </button>
                          ) : (
                            <button
                              className={`btn ${isAdding ? 'btn-outline' : 'btn-gold'}`}
                              style={{ width: '100%', borderRadius: 8, transition: 'all 0.3s ease' }}
                              onClick={e => handleAddToCart(e, product)}
                              disabled={product.stock === 0 || isAdding}
                            >
                              {product.stock === 0 ? 'Out of Stock' : isAdding ? '✓ Added!' : '+ Add to Cart'}
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
                      <div className="product-price">
                        <span className="price-current">₹{product.price}</span>
                        {product.comparePrice && <span className="price-compare">₹{product.comparePrice}</span>}
                        {disc > 0 && <span className="price-discount">Save {disc}%</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-10)', flexWrap: 'wrap' }}>
              {pagination.page > 1 && (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => fetchProducts(activeCategory, search, pagination.page - 1, priceLimit, sort)}
                >
                  ← Prev
                </button>
              )}
              {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                .filter(p => Math.abs(p - pagination.page) <= 2 || p === 1 || p === pagination.pages)
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ lineHeight: '2rem', color: 'var(--color-gray-400)' }}>…</span>}
                    <button
                      className={`btn btn-sm ${p === pagination.page ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => fetchProducts(activeCategory, search, p, priceLimit, sort)}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}
              {pagination.page < pagination.pages && (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => fetchProducts(activeCategory, search, pagination.page + 1, priceLimit, sort)}
                >
                  Next →
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
