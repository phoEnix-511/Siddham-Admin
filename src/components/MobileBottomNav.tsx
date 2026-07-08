import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';

export default function MobileBottomNav() {
  const router = useRouter();
  const { totalItems } = useCart();
  const { catalogMode } = useSettings();

  // Don't show on admin routes
  if (router.pathname.startsWith('/admin')) return null;

  return (
    <div className="mobile-bottom-nav">
      <Link href="/" className={`nav-item ${router.pathname === '/' ? 'active' : ''}`}>
        <span className="icon">🏠</span>
        <span className="label">Home</span>
      </Link>
      
      <Link href="/shop" className={`nav-item ${router.pathname.startsWith('/shop') || router.pathname.startsWith('/products') ? 'active' : ''}`}>
        <span className="icon">🌿</span>
        <span className="label">Shop</span>
      </Link>

      {!catalogMode && (
        <>
          <Link href="/checkout" className={`nav-item ${router.pathname === '/checkout' ? 'active' : ''}`}>
            <div style={{ position: 'relative' }}>
              <span className="icon">🛒</span>
              {totalItems > 0 && (
                <span className="cart-badge">{totalItems}</span>
              )}
            </div>
            <span className="label">Cart</span>
          </Link>

          <Link href="/account" className={`nav-item ${router.pathname.startsWith('/account') ? 'active' : ''}`}>
            <span className="icon">👤</span>
            <span className="label">Account</span>
          </Link>
        </>
      )}
    </div>
  );
}