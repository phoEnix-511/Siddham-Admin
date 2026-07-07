import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/AdminLayout';
import { useToast } from '@/context/ToastContext';

interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: string;
  value: number;
  minCartValue: number;
  isActive: boolean;
}

export default function AdminOffers() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    value: '',
    minCartValue: '',
    isActive: true
  });

  const loadCoupons = async () => {
    try {
      const res = await fetch('/api/admin/offers');
      const data = await res.json();
      setCoupons(data.coupons || []);
    } catch {
      addToast('Failed to load offers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm(prev => ({ ...prev, [e.target.name]: val }));
  };

  const handleEdit = (c: Coupon) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      description: c.description,
      discountType: c.discountType,
      value: c.value.toString(),
      minCartValue: c.minCartValue.toString(),
      isActive: c.isActive
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      value: '',
      minCartValue: '',
      isActive: true
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.value) {
      addToast('Code and Discount Value are required', 'error');
      return;
    }

    try {
      const url = '/api/admin/offers';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { id: editingId, ...form } : form;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to save coupon');

      addToast(editingId ? 'Offer updated successfully!' : 'Offer created successfully!', 'success');
      loadCoupons();
      handleCancel();
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return;
    try {
      const res = await fetch('/api/admin/offers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        addToast('Offer deleted successfully!', 'success');
        loadCoupons();
      } else {
        throw new Error();
      }
    } catch {
      addToast('Failed to delete offer', 'error');
    }
  };

  return (
    <>
      <Head><title>Manage Offers and Deals – Admin</title></Head>
      <AdminLayout title="Manage Offers & Deals">
        
        {/* Create/Edit Form Card */}
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="card-header">
            <h3>{editingId ? 'Edit Offer & Deal' : 'Add New Offer & Deal'}</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="grid-2" style={{ gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Coupon Code (e.g. FIRST10)</label>
                  <input type="text" name="code" value={form.code} onChange={handleChange} className="form-input" placeholder="FIRST10" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Discount Type</label>
                  <select name="discountType" value={form.discountType} onChange={handleChange} className="form-input">
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div className="grid-2" style={{ gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Discount Value</label>
                  <input type="number" name="value" value={form.value} onChange={handleChange} className="form-input" placeholder="e.g. 10" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Min Cart Value (₹)</label>
                  <input type="number" name="minCartValue" value={form.minCartValue} onChange={handleChange} className="form-input" placeholder="e.g. 999" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Offer Description</label>
                <input type="text" name="description" value={form.description} onChange={handleChange} className="form-input" placeholder="Get 10% off on your first order" />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} id="offer-isActive" />
                <label htmlFor="offer-isActive" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>Is Active / Enabled</label>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Update Offer' : 'Save Offer'}
                </button>
                {editingId && (
                  <button type="button" className="btn btn-outline" onClick={handleCancel}>
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Offers List Table */}
        {loading ? (
          <div className="loading-page"><div className="spinner" /></div>
        ) : (
          <div className="card">
            <div className="card-header"><h3>Active Offers and Promo Rules</h3></div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Min Cart Value</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 700 }}>{c.code}</td>
                      <td>{c.description}</td>
                      <td>{c.discountType === 'PERCENTAGE' ? 'Percentage' : 'Fixed Amt'}</td>
                      <td>{c.discountType === 'PERCENTAGE' ? `${c.value}%` : `₹${c.value}`}</td>
                      <td>₹{c.minCartValue}</td>
                      <td>
                        <span className={`status-badge ${c.isActive ? 'confirmed' : 'cancelled'}`}>
                          {c.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-outline" style={{ marginRight: '8px' }} onClick={() => handleEdit(c)}>Edit</button>
                        <button className="btn btn-sm btn-outline" style={{ color: 'red', borderColor: 'red' }} onClick={() => handleDelete(c.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {coupons.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: 'center' }}>No offers or coupons configured yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AdminLayout>
    </>
  );
}
