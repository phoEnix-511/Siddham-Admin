import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/AdminLayout';
import { useToast } from '@/context/ToastContext';

interface SalesDay {
  date: string;
  orders: number;
  revenue: number;
}

interface ProductBreakdown {
  name: string;
  quantity: number;
  revenue: number;
}

interface StockItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  status: string;
  price: number;
}

interface StockSummary {
  total: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

export default function AdminReportsPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'sales' | 'stock'>('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [salesLoading, setSalesLoading] = useState(false);
  const [stockLoading, setStockLoading] = useState(false);

  const [salesData, setSalesData] = useState<{
    totalRevenue: number;
    totalOrders: number;
    daily: SalesDay[];
    productBreakdown: ProductBreakdown[];
    csv: string;
  } | null>(null);

  const [stockData, setStockData] = useState<{
    stockData: StockItem[];
    summary: StockSummary;
    csv: string;
  } | null>(null);

  const fetchSalesReport = async () => {
    setSalesLoading(true);
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const res = await fetch(`/api/reports/sales?${params}`);
    if (res.status === 401) { router.push('/admin/login'); return; }
    const data = await res.json();
    if (res.ok) {
      setSalesData(data);
    } else {
      addToast('Failed to generate report', 'error');
    }
    setSalesLoading(false);
  };

  const fetchStockReport = async () => {
    setStockLoading(true);
    const res = await fetch('/api/reports/stock');
    if (res.status === 401) { router.push('/admin/login'); return; }
    const data = await res.json();
    if (res.ok) {
      setStockData(data);
    } else {
      addToast('Failed to generate stock report', 'error');
    }
    setStockLoading(false);
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Report downloaded!', 'success');
  };

  const STATUS_COLORS: Record<string, string> = {
    IN_STOCK: 'badge-green', LOW_STOCK: 'badge-yellow', OUT_OF_STOCK: 'badge-red',
  };

  return (
    <>
      <Head><title>Reports – Siddham Wellness Admin</title></Head>
      <AdminLayout title="Reports">
        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--color-gray-200)', marginBottom: 'var(--space-6)' }}>
          {(['sales', 'stock'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: 'var(--space-3) var(--space-6)',
                fontWeight: 600, fontSize: '0.875rem', textTransform: 'capitalize',
                color: activeTab === tab ? 'var(--color-forest)' : 'var(--color-gray-500)',
                borderBottom: activeTab === tab ? '2px solid var(--color-saffron)' : '2px solid transparent',
                marginBottom: -2, cursor: 'pointer', background: 'none',
              }}
            >
              {tab === 'sales' ? '📈 Sales Report' : '📦 Stock Report'}
            </button>
          ))}
        </div>

        {/* Sales Report */}
        {activeTab === 'sales' && (
          <div>
            <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
              <div className="card-body">
                <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-forest-dark)', marginBottom: 'var(--space-4)' }}>
                  Sales by Date Range
                </h3>
                <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="sales-start">Start Date</label>
                    <input id="sales-start" className="form-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="sales-end">End Date</label>
                    <input id="sales-end" className="form-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                  </div>
                  <button
                    id="generate-sales-btn"
                    className="btn btn-primary"
                    onClick={fetchSalesReport}
                    disabled={salesLoading}
                  >
                    {salesLoading ? '⏳ Generating...' : '📊 Generate Report'}
                  </button>
                  {salesData && (
                    <button
                      id="download-sales-btn"
                      className="btn btn-outline"
                      onClick={() => downloadCSV(salesData.csv, `siddham-sales-report-${new Date().toISOString().split('T')[0]}.csv`)}
                    >
                      ⬇️ Download CSV
                    </button>
                  )}
                </div>
              </div>
            </div>

            {salesData && (
              <>
                {/* Summary Cards */}
                <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 'var(--space-6)' }}>
                  <div className="stat-card stat-card-green">
                    <div className="stat-icon stat-icon-green">💰</div>
                    <div className="stat-value">₹{salesData.totalRevenue.toFixed(0)}</div>
                    <div className="stat-label">Total Revenue</div>
                  </div>
                  <div className="stat-card stat-card-gold">
                    <div className="stat-icon stat-icon-gold">🛒</div>
                    <div className="stat-value">{salesData.totalOrders}</div>
                    <div className="stat-label">Total Orders</div>
                  </div>
                </div>

                {/* Daily Breakdown */}
                <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
                  <div className="card-header">
                    <h4 style={{ color: 'var(--color-forest-dark)' }}>Daily Sales Breakdown</h4>
                  </div>
                  <div className="table-wrapper" style={{ borderRadius: 0, border: 'none', boxShadow: 'none' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Orders</th>
                          <th>Revenue</th>
                          <th>Avg Order Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesData.daily.length === 0 ? (
                          <tr><td colSpan={4} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-gray-400)' }}>No data for selected range</td></tr>
                        ) : salesData.daily.map(d => (
                          <tr key={d.date}>
                            <td>{d.date}</td>
                            <td>{d.orders}</td>
                            <td style={{ fontWeight: 700, color: 'var(--color-forest)' }}>₹{d.revenue.toFixed(2)}</td>
                            <td>₹{d.orders > 0 ? (d.revenue / d.orders).toFixed(0) : 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Product Breakdown */}
                <div className="card">
                  <div className="card-header">
                    <h4 style={{ color: 'var(--color-forest-dark)' }}>Product Sales Breakdown</h4>
                  </div>
                  <div className="table-wrapper" style={{ borderRadius: 0, border: 'none', boxShadow: 'none' }}>
                    <table className="data-table">
                      <thead>
                        <tr><th>Product</th><th>Units Sold</th><th>Revenue</th></tr>
                      </thead>
                      <tbody>
                        {salesData.productBreakdown.map((p, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 500 }}>{p.name}</td>
                            <td>{p.quantity}</td>
                            <td style={{ fontWeight: 700, color: 'var(--color-forest)' }}>₹{p.revenue.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Stock Report */}
        {activeTab === 'stock' && (
          <div>
            <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
              <button
                id="generate-stock-btn"
                className="btn btn-primary"
                onClick={fetchStockReport}
                disabled={stockLoading}
              >
                {stockLoading ? '⏳ Generating...' : '📦 Generate Stock Report'}
              </button>
              {stockData && (
                <button
                  id="download-stock-btn"
                  className="btn btn-outline"
                  onClick={() => downloadCSV(stockData.csv, `siddham-stock-report-${new Date().toISOString().split('T')[0]}.csv`)}
                >
                  ⬇️ Download CSV
                </button>
              )}
            </div>

            {stockData && (
              <>
                <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 'var(--space-6)' }}>
                  <div className="stat-card">
                    <div className="stat-value">{stockData.summary.total}</div>
                    <div className="stat-label">Total Products</div>
                  </div>
                  <div className="stat-card stat-card-green">
                    <div className="stat-icon stat-icon-green">✅</div>
                    <div className="stat-value">{stockData.summary.inStock}</div>
                    <div className="stat-label">In Stock</div>
                  </div>
                  <div className="stat-card stat-card-gold">
                    <div className="stat-icon stat-icon-gold">⚠️</div>
                    <div className="stat-value">{stockData.summary.lowStock}</div>
                    <div className="stat-label">Low Stock</div>
                  </div>
                  <div className="stat-card stat-card-red">
                    <div className="stat-icon stat-icon-red">❌</div>
                    <div className="stat-value">{stockData.summary.outOfStock}</div>
                    <div className="stat-label">Out of Stock</div>
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>SKU</th>
                        <th>Category</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th>Price (₹)</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockData.stockData.map(p => (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 600 }}>{p.name}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{p.sku}</td>
                          <td style={{ color: 'var(--color-gray-500)', fontSize: '0.8rem' }}>{p.category}</td>
                          <td style={{ fontWeight: 700 }}>{p.stock}</td>
                          <td><span className={`badge ${STATUS_COLORS[p.status] || 'badge-gray'}`}>{p.status.replace('_', ' ')}</span></td>
                          <td>₹{p.price}</td>
                          <td>
                            <a href={`/admin/products/${p.id}`} className="btn btn-ghost btn-sm">Edit Stock</a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </AdminLayout>
    </>
  );
}
