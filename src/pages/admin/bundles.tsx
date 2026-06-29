import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/AdminLayout';

interface Bundle { id: string; title: string; description: string; minItems: number; fixedPrice: number; isActive: boolean; }

export default function AdminBundles() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/bundles').then(r => r.json()).then(d => { setBundles(d.bundles || []); setLoading(false); });
  }, []);

  return (
    <>
      <Head><title>Manage Bundles – Admin</title></Head>
      <AdminLayout title="Bundle Offers">
        {loading ? (
          <div className="loading-page"><div className="spinner" /></div>
        ) : (
          <div className="card">
            <div className="card-header"><h3>Active Bundle Rules</h3></div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr><th>Title</th><th>Min Items</th><th>Price</th><th>Status</th></tr></thead>
                <tbody>
                  {bundles.map(b => (
                    <tr key={b.id}>
                      <td>{b.title}</td>
                      <td>{b.minItems}</td>
                      <td>₹{b.fixedPrice}</td>
                      <td>{b.isActive ? 'Active' : 'Inactive'}</td>
                    </tr>
                  ))}
                  {bundles.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center' }}>No bundles found. (Feature incoming)</td></tr>
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