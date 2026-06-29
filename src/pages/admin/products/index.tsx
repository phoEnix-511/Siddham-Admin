import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { useToast } from '@/context/ToastContext';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku: string;
  isActive: boolean;
  isFeatured: boolean;
  category: { name: string };
}

export default function AdminProductsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [adminRole, setAdminRole] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.admin) {
          setAdminRole(data.admin.role);
        }
      });
  }, []);

  // Pagination & Filters State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showInactive, setShowInactive] = useState(false);

  const fetchProducts = useCallback(async (q = '', pNum = 1, showInact = false) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(pNum),
      limit: '10',
    });
    if (q) params.set('search', q);
    if (showInact) params.set('showInactive', 'true');

    const res = await fetch(`/api/products?${params}`);
    if (res.status === 401) { router.push('/admin/login'); return; }
    const data = await res.json();
    setProducts(data.products || []);
    if (data.pagination) {
      setPage(data.pagination.page);
      setTotalPages(data.pagination.pages || 1);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchProducts(search, page, showInactive);
  }, [page, showInactive, fetchProducts]);

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      addToast('Product deleted', 'success');
      fetchProducts(search, page, showInactive);
    } else {
      addToast('Failed to delete product', 'error');
    }
    setDeleteId(null);
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    if (adminRole === 'viewer') return;
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    });
    if (res.ok) {
      addToast(`Product ${!isActive ? 'activated' : 'deactivated'}`, 'success');
      fetchProducts(search, page, showInactive);
    }
  };

  return (
    <>
      <Head><title>Products – Siddham Wellness Admin</title></Head>
      <AdminLayout title="Product Management">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input
                id="product-search"
                className="form-input"
                style={{ width: 200 }}
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchProducts(search, 1, showInactive)}
              />
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setPage(1);
                  fetchProducts(search, 1, showInactive);
                }}
              >
                Search
              </button>
            </div>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={showInactive}
                onChange={e => {
                  setShowInactive(e.target.checked);
                  setPage(1);
                }}
                style={{ accentColor: 'var(--color-forest)', width: 15, height: 15 }}
              />
              Show Inactive
            </label>
          </div>
          {adminRole !== 'viewer' && (
            <Link href="/admin/products/new" id="add-product-btn" className="btn btn-primary">+ Add Product</Link>
          )}
        </div>
        {loading ? (
          <div className="loading-page"><div className="spinner" /></div>
        ) : (
          <>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div className="table-wrapper" style={{ borderRadius: 0, border: 'none', boxShadow: 'none' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>SKU</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-gray-400)' }}>No products found</td></tr>
                    ) : products.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--color-forest-dark)' }}>{p.name}</div>
                          {p.isFeatured && <span className="badge badge-gold" style={{ marginTop: 4 }}>Featured</span>}
                        </td>
                        <td style={{ color: 'var(--color-gray-500)' }}>{p.category.name}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.sku || '—'}</td>
                        <td style={{ fontWeight: 700, color: 'var(--color-forest)' }}>₹{p.price}</td>
                        <td>
                          <span className={`badge ${p.stock === 0 ? 'badge-red' : p.stock <= 10 ? 'badge-yellow' : 'badge-green'}`}>
                            {p.stock === 0 ? 'Out of Stock' : p.stock <= 10 ? `Low: ${p.stock}` : p.stock}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleToggleActive(p.id, p.isActive)}
                            className={`badge ${p.isActive ? 'badge-green' : 'badge-gray'}`}
                            style={{ cursor: adminRole === 'viewer' ? 'default' : 'pointer', border: 'none', padding: '3px 10px' }}
                            title={adminRole === 'viewer' ? 'Read-only status' : 'Toggle active status'}
                            disabled={adminRole === 'viewer'}
                          >
                            {p.isActive ? '● Active' : '○ Inactive'}
                          </button>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            <Link href={`/admin/products/${p.id}`} className="btn btn-ghost btn-sm">
                              {adminRole === 'viewer' ? 'View' : 'Edit'}
                            </Link>
                            {adminRole !== 'viewer' && (
                              <button
                                className="btn btn-sm"
                                style={{ color: 'var(--color-error)', background: 'var(--color-error-bg)' }}
                                onClick={() => setDeleteId(p.id)}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination block integrated into Card footer */}
              {totalPages > 0 && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: 'var(--space-4) var(--space-6)', 
                  borderTop: '1px solid var(--color-gray-100)',
                  background: '#fafbfa',
                  flexWrap: 'wrap',
                  gap: 'var(--space-3)'
                }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-gray-500)', fontWeight: 500 }}>
                    Showing page <strong>{page}</strong> of <strong>{totalPages}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      disabled={page === 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      style={{ padding: '6px 12px', minWidth: 80 }}
                    >
                      Previous
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      disabled={page === totalPages || totalPages === 0}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      style={{ padding: '6px 12px', minWidth: 80 }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Delete Confirm Modal */}
        {deleteId && (
          <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: 400 }}>
              <div className="modal-header">
                <h3 className="modal-title">Confirm Delete</h3>
                <button className="modal-close" onClick={() => setDeleteId(null)}>×</button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this product? This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline btn-sm" onClick={() => setDeleteId(null)}>Cancel</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(deleteId)}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </>
  );
}
