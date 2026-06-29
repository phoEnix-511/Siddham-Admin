import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/router';

interface CartDrawerProps {
  onClose: () => void;
}

export default function CartDrawer({ onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, totalAmount } = useCart();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shippingAmount = totalAmount >= 999 ? 0 : totalAmount > 0 ? 99 : 0;
  const grandTotal = totalAmount + shippingAmount;

  const handleCheckout = () => {
    onClose();
    router.push('/checkout');
  };

  if (!mounted) return null;

  return createPortal(
    <>
      <div className="cart-overlay" onClick={onClose} />
      <div className="cart-drawer" role="dialog" aria-label="Shopping Cart">
        <div className="cart-header" style={{ padding: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-gray-200)' }}>
          <h2 className="cart-title" style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: '1.4rem', color: 'var(--color-forest-dark)', letterSpacing: '-0.02em', margin: 0 }}>Your Cart 🛍️</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close cart" style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-gray-500)' }}>✕</button>
        </div>

        <div className="cart-items" style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)' }}>
          {items.length === 0 ? (
            <div className="empty-state" style={{ paddingTop: 'var(--space-16)', textAlign: 'center' }}>
              <div className="empty-state-icon" style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🛒</div>
              <h3>Your cart is empty</h3>
              <p style={{ marginTop: 'var(--space-2)', fontSize: '0.875rem' }}>
                Add some Ayurvedic goodness!
              </p>
            </div>
          ) : (
            items.map(item => {
              const itemKey = item.productId + (item.variantId ? `-${item.variantId}` : '');
              return (
                <div key={itemKey} className="cart-item" style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-gray-100)' }}>
                  <div
                    className="cart-item-image"
                    style={{
                      width: 80, height: 80, borderRadius: 12,
                      background: 'var(--color-parchment)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '2rem', flexShrink: 0,
                    }}
                  >
                    🌿
                  </div>
                  <div className="cart-item-info" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div className="cart-item-name" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1rem', color: 'var(--color-forest-dark)', lineHeight: 1.2 }}>
                      {item.name}
                      {item.variantName && (
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: '4px', fontWeight: 500 }}>
                          Variant: {item.variantName}
                        </span>
                      )}
                    </div>
                    <div className="cart-item-price" style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: 'var(--space-1)' }}>₹{item.price}</div>
                    <div className="quantity-control" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'auto', paddingTop: 'var(--space-2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-gray-200)', borderRadius: '9999px', padding: '2px 8px' }}>
                        <button className="qty-btn" onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)} style={{ border: 'none', background: 'transparent', fontSize: '1rem', cursor: 'pointer' }}>-</button>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, minWidth: 28, textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button className="qty-btn" onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)} style={{ border: 'none', background: 'transparent', fontSize: '1rem', cursor: 'pointer' }}>+</button>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId, item.variantId)}
                        style={{ marginLeft: 'auto', color: 'var(--color-gray-400)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, border: 'none', background: 'transparent', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-footer" style={{ padding: 'var(--space-6)', borderTop: '1px solid var(--color-gray-200)', backgroundColor: 'var(--color-gray-50)' }}>
            {shippingAmount === 0 ? (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-forest-dark)', background: 'var(--color-saffron-light)', padding: '8px', borderRadius: '4px', fontWeight: 700, marginBottom: 'var(--space-4)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ✨ You qualify for FREE shipping!
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-600)', background: 'var(--color-gray-200)', padding: '8px', borderRadius: '4px', fontWeight: 600, marginBottom: 'var(--space-4)', textAlign: 'center' }}>
                Add ₹{999 - totalAmount} more for FREE shipping
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--color-gray-600)', marginBottom: 'var(--space-2)', fontWeight: 500 }}>
              <span>Subtotal</span><span>₹{totalAmount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--color-gray-600)', marginBottom: 'var(--space-4)', fontWeight: 500 }}>
              <span>Shipping</span>
              <span>{shippingAmount === 0 ? <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>FREE</span> : `₹${shippingAmount}`}</span>
            </div>

            <div className="cart-total" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)', borderTop: '1px dashed var(--color-gray-300)', paddingTop: 'var(--space-4)' }}>
              <span className="cart-total-label" style={{ fontSize: '1.2rem', fontWeight: 800 }}>Total</span>
              <span className="cart-total-amount" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-forest-dark)' }}>₹{grandTotal}</span>
            </div>
            <button id="checkout-btn" className="btn btn-primary" style={{ width: '100%', borderRadius: '9999px', padding: '16px', fontSize: '1rem', fontWeight: 800, letterSpacing: '0.1em' }} onClick={handleCheckout}>
              PROCEED TO CHECKOUT ➔
            </button>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}
