import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/AdminLayout';
import { useToast } from '@/context/ToastContext';

interface Address {
  address: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastLogin?: string;
  createdAt: string;
  addresses?: Address[];
  _count?: {
    orders: number;
  };
}

export default function AdminCustomersPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminRole, setAdminRole] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const authRes = await fetch('/api/auth/me');
      if (authRes.ok) {
        const { admin } = await authRes.json();
        setAdminRole(admin.role);
        if (admin.role !== 'super_admin') {
          router.push('/admin');
          return;
        }
      }

      const res = await fetch('/api/admin/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      } else {
        addToast('Failed to fetch customers', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error loading customers', 'error');
    } finally {
      setLoading(false);
    }
  }, [router, addToast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleResetPassword = async (id: string) => {
    if (!window.confirm("Are you sure you want to reset this user's password?")) return;
    
    try {
      const res = await fetch(`/api/admin/customers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'reset_password' })
      });
      const data = await res.json();
      
      if (res.ok) {
        addToast(`Password reset. Temp password: ${data.tempPassword}`, 'success');
        window.alert(`Temporary Password for customer is: ${data.tempPassword}\n\nPlease copy this immediately and share it with the user. They will be forced to change it on their next login.`);
      } else {
        addToast(data.error || 'Failed to reset password', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error resetting password', 'error');
    }
  };

  if (loading) return <AdminLayout title="Customers"><div className="loading-page"><div className="spinner" /></div></AdminLayout>;
  if (adminRole !== 'super_admin') return <AdminLayout title="Customers"><p>Unauthorized</p></AdminLayout>;

  return (
    <>
      <Head>
        <title>Customers – Siddham Wellness Admin</title>
      </Head>
      <AdminLayout title="Customer Management">
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Addresses</th>
                  <th>Orders</th>
                  <th>Last Login</th>
                  <th>Registered</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-gray-400)' }}>
                      No customers found
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr key={customer.id}>
                      <td style={{ fontWeight: '500' }}>{customer.name}</td>
                      <td>{customer.email}</td>
                      <td>{customer.phone || 'N/A'}</td>
                      <td>
                        {customer.addresses && customer.addresses.length > 0 ? (
                          <div style={{ maxHeight: '80px', overflowY: 'auto', fontSize: '0.8rem', maxWidth: '250px' }}>
                            {customer.addresses.map((addr, idx) => (
                              <div key={idx} style={{ marginBottom: '4px', borderBottom: idx < customer.addresses!.length - 1 ? '1px solid var(--color-gray-100)' : 'none', paddingBottom: '4px' }}>
                                {addr.isDefault && <span style={{ color: 'var(--color-saffron-dark)', fontWeight: 600 }}>[Default] </span>}
                                {addr.address}, {addr.city}, {addr.state} - {addr.pincode}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--color-gray-400)', fontSize: '0.8rem' }}>No address saved</span>
                        )}
                       </td>
                      <td>{customer._count?.orders || 0}</td>
                      <td>{customer.lastLogin ? new Date(customer.lastLogin).toLocaleString() : 'Never'}</td>
                      <td>{new Date(customer.createdAt).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-outline"
                          onClick={() => handleResetPassword(customer.id)}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                        >
                          Reset Password
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
