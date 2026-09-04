import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

interface OrderItem { quantity: number; price: number; product: { name: string } }
interface Order {
  id: string; orderNumber: string; status: string;
  paymentStatus: string; totalAmount: number;
  createdAt: string; items: OrderItem[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b', CONFIRMED: '#3b82f6', PROCESSING: '#8b5cf6',
  SHIPPED: '#06b6d4', DELIVERED: '#22c55e', CANCELLED: '#ef4444', REFUNDED: '#6b7280',
};

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login?callbackUrl=/account/orders'); return; }
    if (status === 'authenticated') {
      fetch('/api/account/orders')
        .then(r => r.json())
        .then(d => { setOrders(d.orders || []); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  if (status === 'loading' || loading) {
    return <div className="loading-page"><div className="spinner" /></div>;
  }

  return (
    <>
      <Head>
        <title>My Orders — Siddham Wellness</title>
      </Head>
      <div className="orders-page">
        <div className="orders-container">
          <div className="orders-header">
            <Link href="/account" className="back-link">← Back to Account</Link>
            <h1>My Orders</h1>
          </div>

          {orders.length === 0 ? (
            <div className="empty-state">
              <span>📦</span>
              <h3>No orders yet</h3>
              <p>Your order history will appear here.</p>
              <Link href="/shop" className="btn btn-primary">Start Shopping</Link>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map(order => (
                <div key={order.id} className="order-card">
                  <div className="order-top">
                    <div>
                      <span className="order-num">#{order.orderNumber}</span>
                      <span className="order-date">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <span className="status-badge" style={{ background: STATUS_COLORS[order.status] + '18', color: STATUS_COLORS[order.status], borderColor: STATUS_COLORS[order.status] + '40' }}>
                      {order.status}
                    </span>
                  </div>
                  <div className="order-items">
                    {order.items.slice(0, 2).map((item, i) => (
                      <span key={i} className="order-item-name">{item.product.name} ×{item.quantity}</span>
                    ))}
                    {order.items.length > 2 && <span className="order-item-name">+{order.items.length - 2} more</span>}
                  </div>
                  <div className="order-bottom">
                    <span className="order-total">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                    <Link href={`/account/orders/${order.id}`} className="btn btn-outline btn-sm">View Details</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        .loading-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .spinner { width: 40px; height: 40px; border: 3px solid var(--saffron-pale); border-top-color: var(--forest); border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .orders-page { min-height: 100vh; background: var(--parchment); padding: 2rem 1rem; }
        .orders-container { max-width: 700px; margin: 0 auto; }
        .orders-header { margin-bottom: 2rem; }
        .back-link { color: var(--forest); font-size: 0.875rem; font-weight: 600; text-decoration: none; display: block; margin-bottom: 0.75rem; }
        .orders-header h1 { font-family: var(--font-serif); font-size: 2rem; color: var(--forest-dark); margin: 0; }
        .empty-state { background: white; border-radius: 1.25rem; padding: 3rem 2rem; text-align: center; }
        .empty-state span { font-size: 3rem; display: block; margin-bottom: 1rem; }
        .empty-state h3 { font-size: 1.2rem; color: var(--forest-dark); margin: 0 0 0.5rem; }
        .empty-state p { color: var(--gray-500); margin: 0 0 1.5rem; }
        .orders-list { display: flex; flex-direction: column; gap: 1rem; }
        .order-card { background: white; border-radius: 1.1rem; padding: 1.5rem; border: 1.5px solid transparent; transition: all 0.2s; }
        .order-card:hover { border-color: var(--sage); }
        .order-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
        .order-num { font-weight: 700; color: var(--forest-dark); display: block; font-size: 1rem; }
        .order-date { font-size: 0.78rem; color: var(--gray-500); }
        .status-badge { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.05em; padding: 0.25rem 0.75rem; border-radius: 999px; border: 1px solid; text-transform: uppercase; }
        .order-items { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 1rem; }
        .order-item-name { font-size: 0.82rem; background: var(--parchment); color: var(--gray-700); padding: 0.2rem 0.6rem; border-radius: 0.4rem; }
        .order-bottom { display: flex; justify-content: space-between; align-items: center; }
        .order-total { font-family: var(--font-serif); font-size: 1.2rem; color: var(--forest); font-weight: 700; }
        .btn-sm { padding: 0.4rem 1rem; font-size: 0.82rem; }
      `}</style>
    </>
  );
}
