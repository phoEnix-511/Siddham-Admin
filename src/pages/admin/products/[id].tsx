import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/AdminLayout';
import { useToast } from '@/context/ToastContext';

interface Category {
  id: string;
  name: string;
}

interface FormData {
  name: string;
  description: string;
  price: string;
  comparePrice: string;
  stock: string;
  sku: string;
  categoryId: string;
  ingredients: string;
  benefits: string;
  usage: string;
  weight: string;
  isActive: boolean;
  isFeatured: boolean;
}

const defaultForm: FormData = {
  name: '', description: '', price: '', comparePrice: '', stock: '0',
  sku: '', categoryId: '', ingredients: '', benefits: '',
  usage: '', weight: '', isActive: true, isFeatured: false,
};

export default function ProductFormPage() {
  const router = useRouter();
  const { id } = router.query;
  const isNew = id === 'new';
  const { addToast } = useToast();

  const [form, setForm] = useState<FormData>(defaultForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(d => setCategories(d.categories || []));
    if (!isNew && id) {
      fetch(`/api/products/${id}`).then(r => r.json()).then(d => {
        if (d.product) {
          const p = d.product;
          setForm({
            name: p.name, description: p.description,
            price: String(p.price), comparePrice: p.comparePrice ? String(p.comparePrice) : '',
            stock: String(p.stock), sku: p.sku || '', categoryId: p.categoryId,
            ingredients: p.ingredients || '', benefits: p.benefits || '',
            usage: p.usage || '', weight: p.weight || '',
            isActive: p.isActive, isFeatured: p.isFeatured,
          });
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [id, isNew]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(isNew ? '/api/products' : `/api/products/${id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
          comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : null,
          stock: parseInt(form.stock),
          images: [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      addToast(`Product ${isNew ? 'created' : 'updated'} successfully`, 'success');
      router.push('/admin/products');
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Save failed', 'error');
      setSaving(false);
    }
  };

  if (loading) return <AdminLayout title="Loading..."><div className="loading-page"><div className="spinner" /></div></AdminLayout>;

  return (
    <>
      <Head><title>{isNew ? 'New Product' : 'Edit Product'} – Admin</title></Head>
      <AdminLayout title={isNew ? 'Add New Product' : 'Edit Product'}>
        <form onSubmit={handleSubmit}>
          <div className="product-form-grid">
            {/* Main Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              <div className="card">
                <div className="card-header"><h4 style={{ color: 'var(--color-forest-dark)' }}>Basic Information</h4></div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="prod-name">Product Name *</label>
                    <input id="prod-name" className="form-input" name="name" required value={form.name} onChange={handleChange} placeholder="e.g. Brahmi Amla Shampoo" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="prod-desc">Description *</label>
                    <textarea id="prod-desc" className="form-textarea" name="description" required value={form.description} onChange={handleChange} placeholder="Detailed product description..." rows={5} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="prod-category">Category *</label>
                    <select id="prod-category" className="form-select" name="categoryId" required value={form.categoryId} onChange={handleChange}>
                      <option value="">Select Category...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><h4 style={{ color: 'var(--color-forest-dark)' }}>Pricing & Inventory</h4></div>
                <div className="card-body">
                  <div className="grid-3" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="prod-price">Price (₹) *</label>
                      <input id="prod-price" className="form-input" name="price" type="number" step="0.01" min="0" required value={form.price} onChange={handleChange} placeholder="349" />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="prod-compare-price">Compare Price (₹)</label>
                      <input id="prod-compare-price" className="form-input" name="comparePrice" type="number" step="0.01" min="0" value={form.comparePrice} onChange={handleChange} placeholder="499" />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="prod-stock">Stock Quantity *</label>
                      <input id="prod-stock" className="form-input" name="stock" type="number" min="0" required value={form.stock} onChange={handleChange} placeholder="100" />
                    </div>
                  </div>
                  <div className="grid-2" style={{ gap: 'var(--space-4)' }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="prod-sku">SKU</label>
                      <input id="prod-sku" className="form-input" name="sku" value={form.sku} onChange={handleChange} placeholder="SW-SHAMP-001" />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="prod-weight">Weight / Volume</label>
                      <input id="prod-weight" className="form-input" name="weight" value={form.weight} onChange={handleChange} placeholder="200ml or 60 Capsules" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><h4 style={{ color: 'var(--color-forest-dark)' }}>Product Details</h4></div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="prod-ingredients">Ingredients</label>
                    <textarea id="prod-ingredients" className="form-textarea" name="ingredients" value={form.ingredients} onChange={handleChange} placeholder="List all ingredients..." rows={3} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="prod-benefits">Benefits (comma-separated)</label>
                    <textarea id="prod-benefits" className="form-textarea" name="benefits" value={form.benefits} onChange={handleChange} placeholder="Reduces hair fall, Strengthens roots, Adds shine" rows={2} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="prod-usage">Usage Instructions</label>
                    <textarea id="prod-usage" className="form-textarea" name="usage" value={form.usage} onChange={handleChange} placeholder="How to use this product..." rows={3} />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="card">
                <div className="card-header"><h4 style={{ color: 'var(--color-forest-dark)' }}>Publish</h4></div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}>
                    <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} style={{ accentColor: 'var(--color-forest)', width: 16, height: 16 }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-forest-dark)' }}>Active</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>Product visible in store</div>
                    </div>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}>
                    <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} style={{ accentColor: 'var(--color-saffron)', width: 16, height: 16 }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-forest-dark)' }}>Featured</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>Show on home page</div>
                    </div>
                  </label>
                  <div style={{ borderTop: '1px solid var(--color-gray-100)', paddingTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <button id="save-product-btn" type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? '⏳ Saving...' : isNew ? '✅ Create Product' : '💾 Save Changes'}
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => router.push('/admin/products')}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>

              {!isNew && (
                <div className="card" style={{ border: '1px solid var(--color-error-bg)' }}>
                  <div className="card-body">
                    <h4 style={{ color: 'var(--color-error)', marginBottom: 'var(--space-2)', fontSize: '0.9rem' }}>Danger Zone</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)', marginBottom: 'var(--space-3)' }}>
                      Deleting a product is permanent.
                    </p>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      style={{ width: '100%' }}
                      onClick={async () => {
                        if (confirm('Delete this product?')) {
                          await fetch(`/api/products/${id}`, { method: 'DELETE' });
                          router.push('/admin/products');
                        }
                      }}
                    >
                      Delete Product
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </AdminLayout>
    </>
  );
}
