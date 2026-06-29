import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useToast } from '@/context/ToastContext';

export default function AdminChangePasswordPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }
    if (password.length < 8) {
      addToast('Password must be at least 8 characters', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');
      
      addToast('Password updated successfully. Please log in again.', 'success');
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (error: any) {
      addToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-parchment)' }}>
      <Head>
        <title>Change Password - Admin</title>
      </Head>
      <div className="card" style={{ maxWidth: 400, width: '100%', padding: 'var(--space-6)' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-forest)', marginBottom: 'var(--space-2)' }}>
          Password Reset Required
        </h1>
        <p style={{ color: 'var(--color-gray-600)', marginBottom: 'var(--space-6)', fontSize: '0.9rem' }}>
          Your administrator has requested you to change your password for security reasons.
        </p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="pwd">New Password</label>
            <input
              id="pwd"
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="cpwd">Confirm Password</label>
            <input
              id="cpwd"
              type="password"
              className="form-input"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          
          <button type="submit" className="btn" disabled={loading} style={{ marginTop: 'var(--space-2)' }}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
