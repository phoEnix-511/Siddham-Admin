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
};

export default function ShopPage() {
  const router = useRouter();
  const { addItem } = useCart();
  const { addToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchProducts = useCallback(async (cat = '', q = '', page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '12' });
    if (cat) params.set('category', cat);
    if (q) params.set('search', q);
    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data.products || []);
    setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(d => setCategories(d.categories || []));
  }, []);

  useEffect(() => {
    const cat = (router.query.category as string) || '';
    setActiveCategory(cat);
    fetchProducts(cat, search);
  }, [router.query.category, fetchProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(activeCategory, search);
  };

  const handleCategoryFilter = (slug: string) => {
    setActiveCategory(slug);
    fetchProducts(slug, search);
    router.push(slug ? `/shop?category=${slug}` : '/shop', undefined, { shallow: true });
  };

  const discount = (price: number, comparePrice?: number) =>
    comparePrice ? Math.round((1 - price / comparePrice) * 100) : 0;

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
            {activeCategory && <><span className="breadcrumb-sep">/</span><span style={{ textTransform: 'capitalize' }}>{activeCategory.replace('-', ' ')}</span></>}
          </div>
        </div>
      </div>

      <section className="section-sm">
        <div className="container">
          {/* Search + Filter */}
          <div className="filter-bar">
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--space-2)', flex: 1 }}>
              <input
                id="search-input"
                className="form-input"
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ maxWidth: 280 }}
              />
              <button type="submit" className="btn btn-primary btn-sm">Search</button>
            </form>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
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
                  {CATEGORY_ICONS[cat.slug]} {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 'var(--space-5)', color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>
            {!loading && `${pagination.total} products found`}
          </div>

          {loading ? (
            <div className="loading-page"><div className="spinner" /></div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🌿</div>
              <h3>No products found</h3>
              <p>Try a different search or category</p>
            </div>
          ) : (
            <div className="product-grid">
              {products.map(product => {
                const disc = discount(product.price, product.comparePrice);
                return (
                  <div className="product-card" key={product.id}>
                    <Link href={`/products/${product.id}`}>
                      <div className="product-card-image">
                        <div className="img-placeholder">{CATEGORY_ICONS[product.category.slug] || '🌿'}</div>
                        {disc > 0 && <span className="product-card-badge">{disc}% OFF</span>}
                        {product.stock <= 10 && product.stock > 0 && (
                          <span className="product-card-badge" style={{ left: 'auto', right: 'var(--space-3)', background: 'var(--color-bark)' }}>
                            Low Stock
                          </span>
                        )}
                        <div className="product-card-actions">
                          <button
                            className="btn btn-gold"
                            style={{ width: '100%', borderRadius: 8 }}
                            onClick={e => {
                              e.preventDefault();
                              if (product.stock === 0) return;
                              addItem({ productId: product.id, name: product.name, price: product.price, image: '', stock: product.stock });
                              addToast(`${product.name} added to cart`, 'success');
                            }}
                            disabled={product.stock === 0}
                          >
                            {product.stock === 0 ? 'Out of Stock' : '+ Add to Cart'}
                          </button>
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
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-10)' }}>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={`btn btn-sm ${p === pagination.page ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => fetchProducts(activeCategory, search, p)}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
