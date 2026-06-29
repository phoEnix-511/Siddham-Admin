import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  items: Array<{ product: { name: string }; quantity: number }>;
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return <div className="account-loading"><div className="spinner" /></div>;
  }

  if (status === 'unauthenticated') {
    router.push('/login?callbackUrl=/account');
    return null;
  }

  return (
    <>
      <Head>
        <title>My Account — Siddham Wellness</title>
        <meta name="description" content="Manage your Siddham Wellness account, orders and addresses." />
      </Head>

      <div className="account-page">
        <div className="account-container">
          {/* Header */}
          <div className="account-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div className="account-avatar">
                {session?.user?.image
                  ? <img src={session.user.image} alt={session.user.name || ''} />
                  : <span>{(session?.user?.name || session?.user?.email || 'U')[0].toUpperCase()}</span>
                }
              </div>
              <div>
                <h1 className="account-name">{session?.user?.name || 'Welcome!'}</h1>
                <p className="account-email">{session?.user?.email}</p>
              </div>
            </div>
            <button 
              className="btn btn-outline" 
              onClick={() => signOut({ callbackUrl: '/' })}
              style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white', padding: '8px 16px', fontSize: '0.8rem', borderRadius: 'var(--radius-md)' }}
            >
              Sign Out 👋
            </button>
          </div>

          {/* Nav cards */}
          <div className="account-grid">
            <Link href="/account/orders" className="account-card">
              <span className="card-icon">📦</span>
              <h3>My Orders</h3>
              <p>Track and manage your orders</p>
              <span className="card-arrow">→</span>
            </Link>

            <Link href="/account/addresses" className="account-card">
              <span className="card-icon">📍</span>
              <h3>Addresses</h3>
              <p>Saved delivery addresses</p>
              <span className="card-arrow">→</span>
            </Link>

            <Link href="/shop" className="account-card">
              <span className="card-icon">🌿</span>
              <h3>Shop Now</h3>
              <p>Browse Ayurvedic products</p>
              <span className="card-arrow">→</span>
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .account-loading { min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .spinner { width: 40px; height: 40px; border: 3px solid var(--saffron-pale); border-top-color: var(--forest); border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .account-page { min-height: 100vh; background: var(--parchment); padding: 2rem 1rem; }
        .account-container { max-width: 700px; margin: 0 auto; }
        .account-header { display: flex; align-items: center; gap: 1.25rem; background: var(--forest); color: white; border-radius: 1.25rem; padding: 1.75rem; margin-bottom: 2rem; }
        .account-avatar { width: 64px; height: 64px; border-radius: 50%; background: var(--saffron); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; color: white; overflow: hidden; flex-shrink: 0; }
        .account-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .account-name { font-family: var(--font-serif); font-size: 1.4rem; margin: 0 0 0.25rem; color: white !important; }
        .account-email { font-size: 0.85rem; color: rgba(255, 255, 255, 0.8) !important; margin: 0; }
        .account-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        .account-card { background: white; border-radius: 1.1rem; padding: 1.5rem; text-decoration: none; color: var(--color-forest); border: 1.5px solid transparent; transition: all 0.2s; position: relative; display: block; text-align: left; cursor: pointer; width: 100%; font-family: inherit; }
        .account-card:hover { border-color: var(--forest); transform: translateY(-2px); box-shadow: 0 6px 24px rgba(15,35,24,0.1); }
        .signout-card:hover { border-color: #dc2626; }
        .card-icon { font-size: 2rem; display: block; margin-bottom: 0.75rem; }
        .account-card p { font-size: 0.82rem; color: var(--gray-500); margin: 0; }
        .card-arrow { position: absolute; top: 1.25rem; right: 1.25rem; color: var(--gray-400); font-size: 1.1rem; }
        @media (max-width: 480px) { .account-grid { grid-template-columns: 1fr; } }
      `}</style>
    </>
  );
}
