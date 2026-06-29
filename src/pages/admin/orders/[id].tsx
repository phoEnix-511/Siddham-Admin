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
  carrier?: string;
  trackingNumber?: string;
  cancellationReason?: string;
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
    variant?: { name: string; sku?: string } | null;
  }>;
}

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { addToast } = useToast();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
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

  // Address edit states
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  // Fulfillment edit states
  const [isEditingFulfillment, setIsEditingFulfillment] = useState(false);
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  // Cancellation states
  const [cancellationReason, setCancellationReason] = useState('');
  const [isEditingCancellation, setIsEditingCancellation] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/orders/${id}`)
      .then(r => { if (r.status === 401) { router.push('/admin/login'); return null; } return r.json(); })
      .then(d => {
        if (d && d.order) {
          setOrder(d.order);
          setAddressForm({
            address: d.order.shippingAddress.address || '',
            city: d.order.shippingAddress.city || '',
            state: d.order.shippingAddress.state || '',
            pincode: d.order.shippingAddress.pincode || '',
          });
          setCarrier(d.order.carrier || '');
          setTrackingNumber(d.order.trackingNumber || '');
          setCancellationReason(d.order.cancellationReason || '');
          setLoading(false);
        }
      });
  }, [id, router]);

  const updateStatus = async (status: string, paymentStatus?: string) => {
    if (status === 'SHIPPED') {
      setIsEditingFulfillment(true);
      setIsEditingCancellation(false);
      return;
    }
    if (status === 'CANCELLED') {
      setIsEditingCancellation(true);
      setIsEditingFulfillment(false);
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...(paymentStatus && { paymentStatus }) }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
        addToast('Order updated successfully', 'success');
        setIsEditingFulfillment(false);
        setIsEditingCancellation(false);
      } else {
        addToast('Failed to update order', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error updating order', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.address || !addressForm.city || !addressForm.state || !addressForm.pincode) {
      addToast('Please fill in all address fields', 'error');
      return;
    }
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shippingAddress: addressForm }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
        addToast('Shipping address updated successfully', 'success');
        setIsEditingAddress(false);
      } else {
        addToast('Failed to update shipping address', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error updating address', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const saveFulfillment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carrier || !trackingNumber) {
      addToast('Please enter both carrier and tracking number', 'error');
      return;
    }
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'SHIPPED',
          carrier,
          trackingNumber,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
        addToast('Order marked as shipped and tracking details updated', 'success');
        setIsEditingFulfillment(false);
      } else {
        addToast('Failed to update tracking details', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error updating fulfillment details', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const saveCancellation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellationReason) {
      addToast('Please enter a cancellation reason', 'error');
      return;
    }
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CANCELLED',
          cancellationReason,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
        addToast('Order cancelled and customer notified', 'success');
        setIsEditingCancellation(false);
      } else {
        addToast('Failed to cancel order', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error cancelling order', 'error');
    } finally {
      setUpdating(false);
    }
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

        <div className="order-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-6)' }}>
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
                        <td style={{ fontWeight: 600 }}>
                          {item.product.name}
                          {item.variant && (
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-gray-500)', fontWeight: 400, marginTop: 2 }}>
                              Variant: {item.variant.name}
                            </span>
                          )}
                        </td>
                        <td style={{ color: 'var(--color-gray-500)', fontSize: '0.8rem' }}>
                          {item.product.category ? item.product.category.name : 'Uncategorized'}
                        </td>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="card" style={{ padding: 'var(--space-4)' }}>
                <div className="card-header" style={{ padding: 0, marginBottom: 'var(--space-3)' }}><h4 style={{ color: 'var(--color-forest-dark)', margin: 0 }}>Customer</h4></div>
                <div className="card-body" style={{ padding: 0 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{order.customer.name}</div>
                  <div style={{ color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>{order.customer.email}</div>
                  {order.customer.phone && <div style={{ color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>{order.customer.phone}</div>}
                </div>
              </div>

              <div className="card" style={{ padding: 'var(--space-4)' }}>
                <div className="card-header" style={{ padding: 0, marginBottom: 'var(--space-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ color: 'var(--color-forest-dark)', margin: 0 }}>Shipping Address</h4>
                  {!isEditingAddress && adminRole !== 'viewer' && (
                    <button className="btn btn-outline btn-sm" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => setIsEditingAddress(true)}>Edit</button>
                  )}
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  {isEditingAddress ? (
                    <form onSubmit={saveAddress} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.7rem' }}>Street Address</label>
                        <input
                          className="form-input form-input-sm"
                          value={addressForm.address}
                          onChange={e => setAddressForm({ ...addressForm, address: e.target.value })}
                          required
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.7rem' }}>City</label>
                          <input
                            className="form-input form-input-sm"
                            value={addressForm.city}
                            onChange={e => setAddressForm({ ...addressForm, city: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.7rem' }}>State</label>
                          <input
                            className="form-input form-input-sm"
                            value={addressForm.state}
                            onChange={e => setAddressForm({ ...addressForm, state: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.7rem' }}>Pincode</label>
                        <input
                          className="form-input form-input-sm"
                          value={addressForm.pincode}
                          onChange={e => setAddressForm({ ...addressForm, pincode: e.target.value })}
                          required
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                        <button type="submit" className="btn btn-primary btn-sm" disabled={updating}>Save</button>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => setIsEditingAddress(false)}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <div style={{ fontSize: '0.875rem', lineHeight: 1.8, color: 'var(--color-gray-700)' }}>
                      {addr.address}<br />
                      {addr.city}, {addr.state}<br />
                      Pincode: {addr.pincode}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Info */}
            {(order.razorpayOrderId || order.razorpayPaymentId) && (
              <div className="card" style={{ padding: 'var(--space-4)' }}>
                <div className="card-header" style={{ padding: 0, marginBottom: 'var(--space-3)' }}><h4 style={{ color: 'var(--color-forest-dark)', margin: 0 }}>Payment Details</h4></div>
                <div className="card-body" style={{ padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: '0.875rem' }}>
                  {order.paymentMethod && <div><strong>Method:</strong> {order.paymentMethod}</div>}
                  {order.razorpayOrderId && <div><strong>Razorpay Order ID:</strong> <code style={{ fontSize: '0.8rem' }}>{order.razorpayOrderId}</code></div>}
                  {order.razorpayPaymentId && <div><strong>Payment ID:</strong> <code style={{ fontSize: '0.8rem' }}>{order.razorpayPaymentId}</code></div>}
                </div>
              </div>
            )}

            {/* Fulfillment & Cancellation Forms when triggered */}
            {isEditingFulfillment && (
              <div className="card" style={{ padding: 'var(--space-4)', border: '1.5px solid var(--color-saffron)', backgroundColor: 'rgba(196, 133, 42, 0.05)' }}>
                <div className="card-header" style={{ padding: 0, marginBottom: 'var(--space-3)' }}>
                  <h4 style={{ color: 'var(--color-saffron)', margin: 0 }}>Fulfillment Details (Ship Order)</h4>
                </div>
                <form onSubmit={saveFulfillment} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div>
                      <label className="form-label">Carrier Name</label>
                      <input
                        className="form-input"
                        placeholder="e.g. Delhivery, India Post"
                        value={carrier}
                        onChange={e => setCarrier(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">Tracking Number</label>
                      <input
                        className="form-input"
                        placeholder="e.g. 1234567890"
                        value={trackingNumber}
                        onChange={e => setTrackingNumber(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--color-saffron)' }} disabled={updating}>
                      Confirm Shipment & Notify Customer
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => setIsEditingFulfillment(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {isEditingCancellation && (
              <div className="card" style={{ padding: 'var(--space-4)', border: '1.5px solid var(--color-error)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
                <div className="card-header" style={{ padding: 0, marginBottom: 'var(--space-3)' }}>
                  <h4 style={{ color: 'var(--color-error)', margin: 0 }}>Cancel Order</h4>
                </div>
                <form onSubmit={saveCancellation} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div>
                    <label className="form-label">Cancellation Reason / Note</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Out of stock, Customer request"
                      value={cancellationReason}
                      onChange={e => setCancellationReason(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button type="submit" className="btn" style={{ backgroundColor: 'var(--color-error)', color: 'white' }} disabled={updating}>
                      Confirm Cancellation & Notify Customer
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => setIsEditingCancellation(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="card" style={{ padding: 'var(--space-4)' }}>
              <div className="card-header" style={{ padding: 0, marginBottom: 'var(--space-3)' }}><h4 style={{ color: 'var(--color-forest-dark)', margin: 0 }}>Order Info</h4></div>
              <div className="card-body" style={{ padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
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
                    disabled={updating || adminRole === 'viewer'}
                    style={{ fontSize: '0.8rem', width: '100%' }}
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
                    disabled={updating || adminRole === 'viewer'}
                    style={{ fontSize: '0.8rem', width: '100%' }}
                  >
                    {['PENDING', 'PAID', 'FAILED', 'REFUNDED'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                
                {order.notes && (
                  <div style={{ fontSize: '0.8rem' }}>
                    <div style={{ color: 'var(--color-gray-500)', marginBottom: 2 }}>Customer Notes</div>
                    <div style={{ color: 'var(--color-gray-700)', fontStyle: 'italic' }}>{order.notes}</div>
                  </div>
                )}

                {order.carrier && order.trackingNumber && (
                  <div style={{ fontSize: '0.8rem', borderTop: '1px solid var(--color-gray-200)', paddingTop: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-forest-dark)' }}>Fulfillment Details</span>
                      {adminRole !== 'viewer' && (
                        <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', fontSize: '0.7rem' }} onClick={() => setIsEditingFulfillment(true)}>Edit</button>
                      )}
                    </div>
                    <div style={{ color: 'var(--color-gray-600)' }}><strong>Carrier:</strong> {order.carrier}</div>
                    <div style={{ color: 'var(--color-gray-600)', wordBreak: 'break-all' }}><strong>Tracking:</strong> {order.trackingNumber}</div>
                  </div>
                )}

                {order.cancellationReason && (
                  <div style={{ fontSize: '0.8rem', borderTop: '1px solid var(--color-gray-200)', paddingTop: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-error)' }}>Cancellation Reason</span>
                      {adminRole !== 'viewer' && (
                        <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', fontSize: '0.7rem' }} onClick={() => setIsEditingCancellation(true)}>Edit</button>
                      )}
                    </div>
                    <div style={{ color: 'var(--color-gray-700)', fontStyle: 'italic' }}>{order.cancellationReason}</div>
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
