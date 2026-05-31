import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useToast } from '@/context/ToastContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      addToast(`Welcome, ${data.admin.name}!`, 'success');
      router.push('/admin');
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Login failed', 'error');
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Admin Login – Siddham Wellness</title>
      </Head>
      <div className="admin-login-page">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <span className="admin-login-logo">Siddham Wellness</span>
            <span className="admin-login-sub">Admin Portal</span>
            <p className="admin-login-title">Sign in to manage your store</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="admin-email">Email Address</label>
                <input
                  id="admin-email"
                  className="form-input"
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="admin@siddhamwellness.com"
                  autoComplete="email"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="admin-password">Password</label>
                <input
                  id="admin-password"
                  className="form-input"
                  type="password"
                  required
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Your password"
                  autoComplete="current-password"
                />
              </div>
              <button
                id="admin-login-btn"
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ marginTop: 'var(--space-2)', padding: 'var(--space-3)' }}
              >
                {loading ? '⏳ Signing in...' : '🔐 Sign In'}
              </button>
            </div>
          </form>

          <div style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
            <a href="/" style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)' }}>← Back to store</a>
          </div>
        </div>
      </div>
    </>
  );
}
