import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { useToast } from '@/context/ToastContext';
import { formatDate } from '@/lib/utils';

interface OrderDetail {
  id: string;
  orderNumber: string;
  createdAt: string;
  totalAmount: number;
  shippingAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  notes?: string;
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  customer: { name: string; email: string; phone?: string };
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: { name: string; sku?: string; category: { name: string } };
  }>;
}

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { addToast } = useToast();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/orders/${id}`)
      .then(r => { if (r.status === 401) { router.push('/admin/login'); return null; } return r.json(); })
      .then(d => { if (d) { setOrder(d.order); setLoading(false); } });
  }, [id, router]);

  const updateStatus = async (status: string, paymentStatus?: string) => {
    setUpdating(true);
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...(paymentStatus && { paymentStatus }) }),
    });
    if (res.ok) {
      const data = await res.json();
      setOrder(data.order);
      addToast('Order updated successfully', 'success');
    } else {
      addToast('Failed to update order', 'error');
    }
    setUpdating(false);
  };

  if (loading) return <AdminLayout title="Order Detail"><div className="loading-page"><div className="spinner" /></div></AdminLayout>;
  if (!order) return <AdminLayout title="Order Not Found"><div className="empty-state">Order not found</div></AdminLayout>;

  const addr = order.shippingAddress;

  return (
    <>
      <Head><title>Order {order.orderNumber} – Admin</title></Head>
      <AdminLayout title={`Order ${order.orderNumber}`}>
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <Link href="/admin/orders" style={{ color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>← Back to Orders</Link>
        </div>

        <div className="order-detail-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            {/* Order Items */}
            <div className="card">
              <div className="card-header">
                <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-forest-dark)' }}>
                  Order Items
                </h3>
              </div>
              <div className="table-wrapper" style={{ borderRadius: 0, border: 'none', boxShadow: 'none' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>SKU</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map(item => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>{item.product.name}</td>
                        <td style={{ color: 'var(--color-gray-500)', fontSize: '0.8rem' }}>{item.product.category.name}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{item.product.sku || '—'}</td>
                        <td>{item.quantity}</td>
                        <td>₹{item.price}</td>
                        <td style={{ fontWeight: 700 }}>₹{item.price * item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'right', fontWeight: 600, paddingRight: 'var(--space-4)', color: 'var(--color-gray-600)' }}>Shipping</td>
                      <td style={{ fontWeight: 700 }}>₹{order.shippingAmount}</td>
                    </tr>
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'right', fontWeight: 700, paddingRight: 'var(--space-4)', color: 'var(--color-forest-dark)' }}>Total</td>
                      <td style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-forest)' }}>₹{order.totalAmount}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Customer & Shipping */}
            <div className="grid-2">
              <div className="card">
                <div className="card-header"><h4 style={{ color: 'var(--color-forest-dark)' }}>Customer</h4></div>
                <div className="card-body">
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{order.customer.name}</div>
                  <div style={{ color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>{order.customer.email}</div>
                  {order.customer.phone && <div style={{ color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>{order.customer.phone}</div>}
                </div>
              </div>
              <div className="card">
                <div className="card-header"><h4 style={{ color: 'var(--color-forest-dark)' }}>Shipping Address</h4></div>
                <div className="card-body">
                  <div style={{ fontSize: '0.875rem', lineHeight: 1.8, color: 'var(--color-gray-700)' }}>
                    {addr.address}<br />
                    {addr.city}, {addr.state}<br />
                    Pincode: {addr.pincode}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            {(order.razorpayOrderId || order.razorpayPaymentId) && (
              <div className="card">
                <div className="card-header"><h4 style={{ color: 'var(--color-forest-dark)' }}>Payment Details</h4></div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: '0.875rem' }}>
                  {order.paymentMethod && <div><strong>Method:</strong> {order.paymentMethod}</div>}
                  {order.razorpayOrderId && <div><strong>Razorpay Order ID:</strong> <code style={{ fontSize: '0.8rem' }}>{order.razorpayOrderId}</code></div>}
                  {order.razorpayPaymentId && <div><strong>Payment ID:</strong> <code style={{ fontSize: '0.8rem' }}>{order.razorpayPaymentId}</code></div>}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="card">
              <div className="card-header"><h4 style={{ color: 'var(--color-forest-dark)' }}>Order Info</h4></div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ fontSize: '0.8rem' }}>
                  <div style={{ color: 'var(--color-gray-500)', marginBottom: 2 }}>Order Number</div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--color-forest)' }}>{order.orderNumber}</div>
                </div>
                <div style={{ fontSize: '0.8rem' }}>
                  <div style={{ color: 'var(--color-gray-500)', marginBottom: 2 }}>Date</div>
                  <div style={{ fontWeight: 600 }}>{formatDate(order.createdAt)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginBottom: 4 }}>Order Status</div>
                  <select
                    className="form-select"
                    value={order.status}
                    onChange={e => updateStatus(e.target.value)}
                    disabled={updating}
                    style={{ fontSize: '0.8rem' }}
                  >
                    {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginBottom: 4 }}>Payment Status</div>
                  <select
                    className="form-select"
                    value={order.paymentStatus}
                    onChange={e => updateStatus(order.status, e.target.value)}
                    disabled={updating}
                    style={{ fontSize: '0.8rem' }}
                  >
                    {['PENDING', 'PAID', 'FAILED', 'REFUNDED'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                {order.notes && (
                  <div style={{ fontSize: '0.8rem' }}>
                    <div style={{ color: 'var(--color-gray-500)', marginBottom: 2 }}>Notes</div>
                    <div style={{ color: 'var(--color-gray-700)', fontStyle: 'italic' }}>{order.notes}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
