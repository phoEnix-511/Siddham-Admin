import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { useToast } from '@/context/ToastContext';
import { formatDate } from '@/lib/utils';

interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  customer: { name: string; email: string; phone?: string };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'badge-yellow', CONFIRMED: 'badge-blue', PROCESSING: 'badge-blue',
  SHIPPED: 'badge-blue', DELIVERED: 'badge-green', CANCELLED: 'badge-red', REFUNDED: 'badge-gray',
};

const PAY_COLORS: Record<string, string> = {
  PENDING: 'badge-yellow', PAID: 'badge-green', FAILED: 'badge-red', REFUNDED: 'badge-gray',
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchOrders = useCallback(async (status = '', page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (status) params.set('status', status);
    const res = await fetch(`/api/orders?${params}`);
    if (res.status === 401) { router.push('/admin/login'); return; }
    const data = await res.json();
    setOrders(data.orders || []);
    setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    setLoading(false);
  }, [router]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateOrderStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      addToast('Order status updated', 'success');
      fetchOrders(statusFilter);
    } else {
      addToast('Failed to update order', 'error');
    }
  };

  const statuses = ['', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  return (
    <>
      <Head><title>Orders – Siddham Wellness Admin</title></Head>
      <AdminLayout title="Order Management">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {statuses.map(s => (
              <button
                key={s}
                className={`filter-chip ${statusFilter === s ? 'active' : ''}`}
                onClick={() => { setStatusFilter(s); fetchOrders(s); }}
              >
                {s || 'All'}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-500)' }}>
            {pagination.total} orders
          </div>
        </div>

        {loading ? (
          <div className="loading-page"><div className="spinner" /></div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="table-wrapper" style={{ borderRadius: 0, border: 'none', boxShadow: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-gray-400)' }}>No orders found</td></tr>
                  ) : orders.map(o => (
                    <tr key={o.id}>
                      <td>
                        <Link href={`/admin/orders/${o.id}`} style={{ fontWeight: 700, color: 'var(--color-forest)' }}>
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{o.customer.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-gray-400)' }}>{o.customer.email}</div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)' }}>{formatDate(o.createdAt)}</td>
                      <td style={{ fontWeight: 700, color: 'var(--color-forest)' }}>₹{o.totalAmount}</td>
                      <td><span className={`badge ${PAY_COLORS[o.paymentStatus] || 'badge-gray'}`}>{o.paymentStatus}</span></td>
                      <td><span className={`badge ${STATUS_COLORS[o.status] || 'badge-gray'}`}>{o.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                          <Link href={`/admin/orders/${o.id}`} className="btn btn-ghost btn-sm">View</Link>
                          <select
                            className="form-select"
                            style={{ fontSize: '0.75rem', padding: '4px 8px', height: 'auto' }}
                            value={o.status}
                            onChange={e => updateOrderStatus(o.id, e.target.value)}
                          >
                            {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination integrated into Card footer */}
            {pagination.pages > 0 && (
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
                  Showing page <strong>{pagination.page}</strong> of <strong>{pagination.pages}</strong> ({pagination.total} total orders)
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={pagination.page === 1}
                    onClick={() => fetchOrders(statusFilter, Math.max(1, pagination.page - 1))}
                    style={{ padding: '6px 12px', minWidth: 80 }}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={pagination.page === pagination.pages || pagination.pages === 0}
                    onClick={() => fetchOrders(statusFilter, Math.min(pagination.pages, pagination.page + 1))}
                    style={{ padding: '6px 12px', minWidth: 80 }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </AdminLayout>
    </>
  );
}
