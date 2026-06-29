import React from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/AdminLayout';

export default function AdminRewards() {
  return (
    <>
      <Head><title>Manage Rewards – Admin</title></Head>
      <AdminLayout title="Rewards Program">
        <div className="card">
          <div className="card-header"><h3>Customer Points Overview</h3></div>
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-gray-500)' }}>
            Feature currently tracks points via Checkout. Advanced management coming soon.
          </div>
        </div>
      </AdminLayout>
    </>
  );
}