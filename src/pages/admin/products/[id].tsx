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
  caption: string;
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
  images: string[];
  videoUrl: string;
}

const defaultForm: FormData = {
  name: '', caption: '', description: '', price: '', comparePrice: '', stock: '0',
  sku: '', categoryId: '', ingredients: '', benefits: '',
  usage: '', weight: '', isActive: true, isFeatured: false,
  images: [], videoUrl: '',
};

interface ProductVariantForm {
  id?: string;
  name: string;
  price: string;
  comparePrice: string;
  stock: string;
  sku: string;
}

export default function ProductFormPage() {
  const router = useRouter();
  const { id } = router.query;
  const isNew = id === 'new';
  const { addToast } = useToast();

  const [form, setForm] = useState<FormData>(defaultForm);
  const [variants, setVariants] = useState<ProductVariantForm[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const compressImage = (file: File, maxWidth = 800, maxHeight = 800): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedBase64);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const compressedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressed = await compressImage(file);
        compressedUrls.push(compressed);
      }
      setForm(prev => ({
        ...prev,
        images: [...prev.images, ...compressedUrls],
      }));
      addToast(`Successfully added ${files.length} photo(s)`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to compress and load photo', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    setForm(prev => {
      const newImages = [...prev.images];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newImages.length) return prev;
      const temp = newImages[index];
      newImages[index] = newImages[targetIndex];
      newImages[targetIndex] = temp;
      return { ...prev, images: newImages };
    });
  };

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(d => setCategories(d.categories || []));
    if (!isNew && id) {
      fetch(`/api/products/${id}`).then(r => r.json()).then(d => {
        if (d.product) {
          const p = d.product;
          setForm({
            name: p.name, caption: p.caption || '', description: p.description,
            price: String(p.price), comparePrice: p.comparePrice ? String(p.comparePrice) : '',
            stock: String(p.stock), sku: p.sku || '', categoryId: p.categoryId,
            ingredients: p.ingredients || '', benefits: p.benefits || '',
            usage: p.usage || '', weight: p.weight || '',
            isActive: p.isActive, isFeatured: p.isFeatured,
            images: p.images || [], videoUrl: p.videoUrl || '',
          });
          if (p.variants) {
            setVariants(p.variants.map((v: any) => ({
              id: v.id,
              name: v.name,
              price: String(v.price),
              comparePrice: v.comparePrice ? String(v.comparePrice) : '',
              stock: String(v.stock),
              sku: v.sku || '',
            })));
          }
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
          variants: variants.map(v => ({
            id: v.id,
            name: v.name,
            price: parseFloat(v.price) || 0,
            comparePrice: v.comparePrice ? parseFloat(v.comparePrice) : null,
            stock: parseInt(v.stock) || 0,
            sku: v.sku || null,
          })),
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
                    <label className="form-label" htmlFor="prod-caption">Short Caption / Tagline</label>
                    <input id="prod-caption" className="form-input" name="caption" value={form.caption} onChange={handleChange} placeholder="e.g. Premium herbal shampoo for hair growth" maxLength={120} />
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: '4px' }}>{form.caption.length}/120 characters</div>
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
                <div className="card-header"><h4 style={{ color: 'var(--color-forest-dark)' }}>Media (Photos & Video)</h4></div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Upload Product Photos</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="form-input"
                        style={{ padding: 'var(--space-2)' }}
                        onChange={handleFileChange}
                        disabled={uploading}
                      />
                      {uploading && <div style={{ fontSize: '0.85rem', color: 'var(--color-saffron)', fontWeight: 600 }}>⏳ Resizing & compressing photos...</div>}
                    </div>
                  </div>

                  {form.images.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                      <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)' }}>Current Images (First is cover)</label>
                      {form.images.map((img, idx) => (
                        <div key={idx} style={{
                          display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                          padding: 'var(--space-2)', border: '1px solid var(--color-gray-200)',
                          borderRadius: 'var(--radius-md)', background: 'var(--color-gray-50)'
                        }}>
                          <img
                            src={img}
                            alt={`Preview ${idx + 1}`}
                            style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 'var(--radius-sm)', background: 'var(--color-gray-100)' }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpolyline points="21 15 16 10 5 21"%3E%3C/polyline%3E%3C/svg%3E';
                            }}
                          />
                          <div style={{ flex: 1, fontSize: '0.8rem', color: 'var(--color-gray-600)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {img.startsWith('data:') ? `Uploaded Photo #${idx + 1}` : img.split('/').pop() || img}
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button type="button" className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} disabled={idx === 0} onClick={() => handleMoveImage(idx, 'up')}>
                              ▲
                            </button>
                            <button type="button" className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} disabled={idx === form.images.length - 1} onClick={() => handleMoveImage(idx, 'down')}>
                              ▼
                            </button>
                            <button type="button" className="btn btn-sm" style={{ padding: '4px 8px', color: 'var(--color-error)', background: 'var(--color-error-bg)' }} onClick={() => handleRemoveImage(idx)}>
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="form-group" style={{ marginTop: 'var(--space-2)' }}>
                    <label className="form-label" htmlFor="prod-video">YouTube Video URL</label>
                    <input
                      id="prod-video"
                      className="form-input"
                      name="videoUrl"
                      placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                      value={form.videoUrl}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><h4 style={{ color: 'var(--color-forest-dark)' }}>Pricing & Inventory (Base Product)</h4></div>
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
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ color: 'var(--color-forest-dark)' }}>Product Variants (e.g., sizes, volumes)</h4>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setVariants(prev => [...prev, { name: '', price: '', comparePrice: '', stock: '0', sku: '' }])}
                  >
                    + Add Variant
                  </button>
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {variants.length === 0 ? (
                    <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-gray-400)', border: '2px dashed var(--color-gray-200)', borderRadius: 'var(--radius-md)' }}>
                      No variants added. Single-variant products will use the base price and stock above.
                    </div>
                  ) : (
                    variants.map((v, idx) => (
                      <div key={idx} style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 1fr 2fr auto',
                        gap: 'var(--space-3)',
                        alignItems: 'end',
                        padding: 'var(--space-3)',
                        border: '1px solid var(--color-gray-200)',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--color-gray-50)'
                      }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Name (e.g. 200 ml) *</label>
                          <input
                            required
                            className="form-input form-input-sm"
                            style={{ padding: '6px var(--space-2)' }}
                            value={v.name}
                            onChange={e => {
                              const next = [...variants];
                              next[idx].name = e.target.value;
                              setVariants(next);
                            }}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Price (₹) *</label>
                          <input
                            required
                            type="number"
                            step="0.01"
                            min="0"
                            className="form-input form-input-sm"
                            style={{ padding: '6px var(--space-2)' }}
                            value={v.price}
                            onChange={e => {
                              const next = [...variants];
                              next[idx].price = e.target.value;
                              setVariants(next);
                            }}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Compare Price (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="form-input form-input-sm"
                            style={{ padding: '6px var(--space-2)' }}
                            value={v.comparePrice}
                            onChange={e => {
                              const next = [...variants];
                              next[idx].comparePrice = e.target.value;
                              setVariants(next);
                            }}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Stock *</label>
                          <input
                            required
                            type="number"
                            min="0"
                            className="form-input form-input-sm"
                            style={{ padding: '6px var(--space-2)' }}
                            value={v.stock}
                            onChange={e => {
                              const next = [...variants];
                              next[idx].stock = e.target.value;
                              setVariants(next);
                            }}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>SKU</label>
                          <input
                            className="form-input form-input-sm"
                            style={{ padding: '6px var(--space-2)' }}
                            value={v.sku}
                            onChange={e => {
                              const next = [...variants];
                              next[idx].sku = e.target.value;
                              setVariants(next);
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{
                            padding: 'var(--space-2) var(--space-3)',
                            color: 'var(--color-error)',
                            background: 'var(--color-error-bg)',
                            marginBottom: '2px',
                            height: '38px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onClick={() => setVariants(prev => prev.filter((_, i) => i !== idx))}
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
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
