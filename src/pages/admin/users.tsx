import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/AdminLayout';
import { useToast } from '@/context/ToastContext';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLogin?: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string; role: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.admin) {
          setCurrentAdmin(data.admin);
        }
      })
      .catch(console.error);
  }, []);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.admins || []);
      } else {
        addToast('Failed to fetch admin users', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error loading admins', 'error');
    } finally {
      setLoading(false);
    }
  }, [router, addToast]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      addToast('Please fill in all fields', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        addToast(`Admin ${data.admin.name} created successfully`, 'success');
        setForm({ name: '', email: '', password: '', role: 'admin' });
        fetchAdmins();
      } else {
        addToast(data.error || 'Failed to create admin user', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error creating admin user', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok) {
        addToast('Admin account deleted', 'success');
        fetchAdmins();
      } else {
        addToast(data.error || 'Failed to delete admin', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error deleting admin', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  const handleUpdateRole = async (id: string, role: string) => {
    try {
      const res = await fetch(`/api/admin/users`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'update_role', role })
      });
      const data = await res.json();
      
      if (res.ok) {
        addToast('Role updated successfully', 'success');
        fetchAdmins();
      } else {
        addToast(data.error || 'Failed to update role', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error updating role', 'error');
    }
  };

  const handleResetPassword = async (id: string) => {
    if (!window.confirm("Are you sure you want to reset this user's password?")) return;
    
    try {
      const res = await fetch(`/api/admin/users`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'reset_password' })
      });
      const data = await res.json();
      
      if (res.ok) {
        addToast(`Password reset. Temp password: ${data.tempPassword} (Copy this now!)`, 'success');
        // Let it remain on screen a bit longer, maybe alert it so they don't miss it
        window.alert(`Temporary Password for user is: ${data.tempPassword}\n\nPlease copy this immediately and share it with the user. They will be forced to change it on their next login.`);
      } else {
        addToast(data.error || 'Failed to reset password', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error resetting password', 'error');
    }
  };

  return (
    <>
      <Head>
        <title>Admins – Siddham Wellness Admin</title>
      </Head>
      <AdminLayout title="Admin User Management">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '350px 1fr',
          gap: 'var(--space-6)',
          alignItems: 'start'
        }}>
          {/* Add Admin Form */}
          <div className="card" style={{ padding: 'var(--space-5)' }}>
            <h3 style={{ margin: '0 0 var(--space-4)', fontSize: '1.1rem', color: 'var(--color-forest-dark)', fontFamily: 'Georgia, serif' }}>
              Add New Admin
            </h3>
            <form onSubmit={handleAddAdmin}>
              <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
                <label className="form-label" htmlFor="admin-name">Name</label>
                <input
                  id="admin-name"
                  className="form-input"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="Full Name"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
                <label className="form-label" htmlFor="admin-email">Email Address</label>
                <input
                  id="admin-email"
                  type="email"
                  className="form-input"
                  name="email"
                  value={form.email}
                  onChange={handleInputChange}
                  placeholder="admin@siddhamwellness.com"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
                <label className="form-label" htmlFor="admin-password">Password</label>
                <input
                  id="admin-password"
                  type="password"
                  className="form-input"
                  name="password"
                  value={form.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                <label className="form-label" htmlFor="admin-role">Role</label>
                <select
                  id="admin-role"
                  className="form-input"
                  name="role"
                  value={form.role}
                  onChange={handleInputChange}
                >
                  <option value="super_admin">Super Administrator</option>
                  <option value="admin">Administrator</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Add Admin User'}
              </button>
            </form>
          </div>

          {/* Admin list */}
          <div>
            {loading ? (
              <div className="loading-page"><div className="spinner" /></div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Last Login</th>
                      <th>Created</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-gray-400)' }}>
                          No admin users found
                        </td>
                      </tr>
                    ) : (
                      admins.map((admin) => (
                        <tr key={admin.id}>
                          <td style={{ fontWeight: 600, color: 'var(--color-forest-dark)' }}>{admin.name}</td>
                          <td>{admin.email}</td>
                           <td>
                            {currentAdmin && admin.id !== currentAdmin.id ? (
                              <select
                                className="form-input"
                                style={{ padding: '0.25rem 0.5rem', width: 'auto', fontSize: '0.85rem' }}
                                value={admin.role}
                                onChange={(e) => handleUpdateRole(admin.id, e.target.value)}
                              >
                                <option value="super_admin">Super Admin</option>
                                <option value="admin">Admin</option>
                                <option value="editor">Editor</option>
                                <option value="viewer">Viewer</option>
                              </select>
                            ) : (
                              <span style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: admin.role === 'super_admin' ? '#fef3c7' : '#f3f4f6',
                                color: admin.role === 'super_admin' ? '#d97706' : '#4b5563'
                              }}>
                                {admin.role.toUpperCase()} (You)
                              </span>
                            )}
                          </td>
                          <td>{admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : 'Never'}</td>
                          <td>{new Date(admin.createdAt).toLocaleDateString()}</td>
                          <td style={{ textAlign: 'right' }}>
                            {deleteId === admin.id ? (
                              <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-error)' }}>Confirm?</span>
                                <button
                                  className="btn btn-sm"
                                  style={{ padding: '2px 8px', backgroundColor: 'var(--color-error)', color: 'white' }}
                                  onClick={() => handleDeleteAdmin(admin.id)}
                                >
                                  Yes
                                </button>
                                <button
                                  className="btn btn-outline btn-sm"
                                  style={{ padding: '2px 8px' }}
                                  onClick={() => setDeleteId(null)}
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  className="btn btn-outline"
                                  onClick={() => handleResetPassword(admin.id)}
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', marginRight: '0.5rem' }}
                                >
                                  Reset Password
                                </button>
                                <button
                                  className="btn btn-outline"
                                  style={{
                                    padding: '4px 8px',
                                    color: 'var(--color-error)',
                                    borderColor: 'rgba(239, 68, 68, 0.2)',
                                    fontSize: '0.8rem'
                                  }}
                                  onClick={() => setDeleteId(admin.id)}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
