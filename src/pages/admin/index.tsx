import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  pendingOrders: number;
  analytics?: {
    uniqueUsersLast30Days: number;
    registeredUsers: number;
    topProductsInCart: string[];
    usersWithActiveCart: number;
    topPages: string[];
  };
}

interface LiveMetrics {
  activeUsers: number;
  activeCarts: number;
  activeAdmins?: any[];
}

interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  totalAmount: number;
  status: string;
  customer: { name: string; email: string };
}

interface Product {
  id: string;
  name: string;
  stock: number;
  category: { name: string };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/admin/stats');
      if (res.status === 401) { router.push('/admin/login'); return; }
      const data = await res.json();
      setStats(data.stats);
      setLiveMetrics(data.liveMetrics);
      setRecentOrders(data.recentOrders);
      setLowStockProducts(data.lowStockProducts);
      setLoading(false);
    };
    load();
    // Refresh live metrics every 30 seconds
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [router]);

  const statusColors: Record<string, string> = {
    PENDING: 'badge-yellow', CONFIRMED: 'badge-blue', PROCESSING: 'badge-blue',
    SHIPPED: 'badge-blue', DELIVERED: 'badge-green', CANCELLED: 'badge-red',
  };

  return (
    <>
      <Head><title>Dashboard – Siddham Wellness Admin</title></Head>
      <AdminLayout title="Dashboard">
        {loading ? (
          <div className="loading-page"><div className="spinner" /></div>
        ) : (
          <>
            {/* Stats */}
            <div className="stat-grid">
              <div className="stat-card stat-card-green">
                <div className="stat-icon stat-icon-green">💰</div>
                <div className="stat-value">{formatCurrency(stats?.totalRevenue || 0)}</div>
                <div className="stat-label">Total Revenue</div>
              </div>
              <div className="stat-card stat-card-gold">
                <div className="stat-icon stat-icon-gold">🛒</div>
                <div className="stat-value">{stats?.totalOrders || 0}</div>
                <div className="stat-label">Total Orders</div>
              </div>
              <div className="stat-card stat-card-blue">
                <div className="stat-icon stat-icon-blue">👥</div>
                <div className="stat-value">{stats?.totalCustomers || 0}</div>
                <div className="stat-label">Customers</div>
              </div>
              <div className="stat-card stat-card-red">
                <div className="stat-icon stat-icon-red">⏳</div>
                <div className="stat-value">{stats?.pendingOrders || 0}</div>
                <div className="stat-label">Pending Orders</div>
              </div>
            </div>

            {/* Live Metrics */}
            <div className="grid-2" style={{ alignItems: 'start', marginTop: 'var(--space-6)' }}>
              <div className="card" style={{ background: 'linear-gradient(135deg, var(--color-forest-dark), var(--color-forest))', color: 'white' }}>
                <div className="card-header">
                  <h3 style={{ fontSize: '1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e', animation: 'pulse 2s infinite' }}></span>
                    Live Analytics
                  </h3>
                </div>
                <div style={{ display: 'flex', gap: '2rem', padding: 'var(--space-6)' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Active Users (5m)</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-saffron)' }}>{liveMetrics?.activeUsers || 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Active Carts</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-saffron-light)' }}>{stats?.analytics?.usersWithActiveCart || liveMetrics?.activeCarts || 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Unique Users (30d)</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'white' }}>{stats?.analytics?.uniqueUsersLast30Days || 0}</div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 style={{ fontSize: '1rem', color: 'var(--color-forest-dark)' }}>Top Pages (All Time)</h3>
                </div>
                <div style={{ padding: 'var(--space-4)' }}>
                  {stats?.analytics?.topPages?.length ? (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {stats.analytics.topPages.map((page: string, i: number) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                          <span style={{ color: 'var(--color-gray-400)', width: '20px' }}>{i + 1}.</span>
                          <span style={{ fontWeight: 500, color: 'var(--color-forest)' }}>{page}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ color: 'var(--color-gray-400)', fontSize: '0.9rem' }}>No pageview data yet.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Active Admins */}
            <div className="grid-1" style={{ marginTop: 'var(--space-6)' }}>
              <div className="card">
                <div className="card-header">
                  <h3 style={{ fontSize: '1rem', color: 'var(--color-forest-dark)' }}>🟢 Active Admins</h3>
                </div>
                <div style={{ padding: 'var(--space-4)' }}>
                  {liveMetrics?.activeAdmins?.length ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                      {liveMetrics.activeAdmins.map((admin: any) => (
                        <div key={admin.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--color-gray-50)', borderRadius: 'var(--radius-md)' }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-forest-light)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            {admin.name?.substring(0, 2).toUpperCase() || 'AD'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-forest-dark)' }}>{admin.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', textTransform: 'capitalize' }}>{admin.role.replace('_', ' ')}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--color-gray-400)', fontSize: '0.9rem' }}>No other admins currently online.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Two Column */}
            <div className="grid-2" style={{ alignItems: 'start', marginTop: 'var(--space-6)' }}>
              {/* Recent Orders */}
              <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1rem', color: 'var(--color-forest-dark)' }}>Recent Orders</h3>
                  <Link href="/admin/orders" className="btn btn-ghost btn-sm">View All →</Link>
                </div>
                <div className="table-wrapper" style={{ borderRadius: 0, border: 'none', boxShadow: 'none' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map(o => (
                        <tr key={o.id}>
                          <td>
                            <Link href={`/admin/orders/${o.id}`} style={{ fontWeight: 600, color: 'var(--color-forest)' }}>
                              {o.orderNumber}
                            </Link>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-gray-400)' }}>{formatDate(o.createdAt)}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 500 }}>{o.customer.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-gray-400)' }}>{o.customer.email}</div>
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--color-forest)' }}>₹{o.totalAmount}</td>
                          <td><span className={`badge ${statusColors[o.status] || 'badge-gray'}`}>{o.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Low Stock */}
              <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1rem', color: 'var(--color-forest-dark)' }}>⚠️ Low Stock Alert</h3>
                  <Link href="/admin/products" className="btn btn-ghost btn-sm">Manage →</Link>
                </div>
                {lowStockProducts.length === 0 ? (
                  <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-gray-400)' }}>
                    ✅ All products are well-stocked
                  </div>
                ) : (
                  <div className="table-wrapper" style={{ borderRadius: 0, border: 'none', boxShadow: 'none' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Category</th>
                          <th>Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lowStockProducts.map(p => (
                          <tr key={p.id}>
                            <td style={{ fontWeight: 500 }}>{p.name}</td>
                            <td style={{ color: 'var(--color-gray-500)', fontSize: '0.8rem' }}>{p.category.name}</td>
                            <td>
                              <span className={`badge ${p.stock === 0 ? 'badge-red' : 'badge-yellow'}`}>
                                {p.stock === 0 ? 'OUT' : p.stock}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
              <Link href="/admin/products/new" className="btn btn-primary">+ Add Product</Link>
              <Link href="/admin/orders" className="btn btn-outline">View All Orders</Link>
              <Link href="/admin/reports" className="btn btn-outline">📈 Reports</Link>
              <Link href="/admin/settings" className="btn btn-outline">⚙️ Settings</Link>
            </div>
          </>
        )}
      </AdminLayout>
    </>
  );
}
