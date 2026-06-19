import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useToast } from '@/context/ToastContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/products', label: 'Products', icon: '📦' },
  { href: '/admin/orders', label: 'Orders', icon: '🛒' },
  { href: '/admin/reports', label: 'Reports', icon: '📈' },
  { href: '/admin/users', label: 'Admins', icon: '👥' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

export default function AdminLayout({ children, title = 'Dashboard' }: AdminLayoutProps) {
  const router = useRouter();
  const { addToast } = useToast();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    addToast('Logged out successfully', 'info');
    router.push('/admin/login');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar" role="complementary" aria-label="Admin navigation">
        <div className="admin-sidebar-logo">
          <span className="admin-sidebar-brand">Siddham Wellness</span>
          <span className="admin-sidebar-sub">Admin Portal</span>
        </div>

        <nav className="admin-sidebar-nav">
          <div className="admin-nav-section">
            <div className="admin-nav-section-label">Main</div>
            {navItems.slice(0, 3).map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-item ${router.pathname === item.href || (item.href !== '/admin' && router.pathname.startsWith(item.href)) ? 'active' : ''}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="admin-nav-section">
            <div className="admin-nav-section-label">Management</div>
            {navItems.slice(3).map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-item ${router.pathname.startsWith(item.href) ? 'active' : ''}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="admin-nav-section">
            <div className="admin-nav-section-label">Site</div>
            <a href="/" target="_blank" className="admin-nav-item">
              <span>🌐</span>
              <span>View Store</span>
            </a>
          </div>
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-nav-item" onClick={handleLogout} style={{ width: '100%', color: '#ef4444' }}>
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <h1 className="admin-topbar-title">{title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-forest-dark)' }}>Admin</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-gray-500)' }}>Siddham Wellness</div>
            </div>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-forest), var(--color-saffron))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: '0.9rem',
            }}>
              SW
            </div>
          </div>
        </header>
        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
}
