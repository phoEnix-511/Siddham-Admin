import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCart } from '@/context/CartContext';
import CartDrawer from './CartDrawer';

export default function Navbar() {
  const router = useRouter();
  const { totalItems, isOpen, openCart, closeCart } = useCart();

  const links = [
    { href: '/', label: 'Home' },
    { href: '/shop', label: 'Shop' },
    { href: '/shop?category=hair-care', label: 'Hair Care' },
    { href: '/shop?category=supplements', label: 'Supplements' },
    { href: '/about', label: 'Our Story' },
  ];

  return (
    <>
      <nav className="nav" role="navigation" aria-label="Main navigation">
        <div className="nav-inner">
          <Link href="/" className="nav-logo" aria-label="Siddham Wellness Home">
            <span className="nav-logo-name">Siddham Wellness</span>
            <span className="nav-logo-tagline">Ancient Wisdom · Modern Wellness</span>
          </Link>

          <div className="nav-links">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={`nav-link ${router.pathname === l.href ? 'active' : ''}`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="nav-actions">
            <button
              id="cart-btn"
              className="nav-cart-btn"
              onClick={openCart}
              aria-label={`Open cart, ${totalItems} items`}
            >
              <span>🛒</span>
              <span>Cart</span>
              {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </button>
          </div>
        </div>
      </nav>

      {isOpen && <CartDrawer onClose={closeCart} />}
    </>
  );
}
