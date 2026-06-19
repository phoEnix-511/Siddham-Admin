import React from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/router';

interface CartDrawerProps {
  onClose: () => void;
}

export default function CartDrawer({ onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, totalAmount } = useCart();
  const router = useRouter();

  const shippingAmount = totalAmount >= 999 ? 0 : totalAmount > 0 ? 99 : 0;
  const grandTotal = totalAmount + shippingAmount;

  const handleCheckout = () => {
    onClose();
    router.push('/checkout');
  };

  return (
    <>
      <div className="cart-overlay" onClick={onClose} />
      <div className="cart-drawer" role="dialog" aria-label="Shopping Cart">
        <div className="cart-header">
          <h2 className="cart-title">Your Cart 🌿</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close cart">×</button>
        </div>

        <div className="cart-items">
          {items.length === 0 ? (
            <div className="empty-state" style={{ paddingTop: 'var(--space-16)' }}>
              <div className="empty-state-icon">🛒</div>
              <h3>Your cart is empty</h3>
              <p style={{ marginTop: 'var(--space-2)', fontSize: '0.875rem' }}>
                Add some Ayurvedic goodness!
              </p>
            </div>
          ) : (
            items.map(item => {
              const itemKey = item.productId + (item.variantId ? `-${item.variantId}` : '');
              return (
                <div key={itemKey} className="cart-item">
                  <div
                    className="cart-item-image"
                    style={{
                      width: 70, height: 70, borderRadius: 8,
                      background: 'var(--color-parchment)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.5rem', flexShrink: 0,
                    }}
                  >
                    🌿
                  </div>
                  <div className="cart-item-info">
                    <div className="cart-item-name">
                      {item.name}
                      {item.variantName && (
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: '2px', fontWeight: 400 }}>
                          Variant: {item.variantName}
                        </span>
                      )}
                    </div>
                    <div className="cart-item-price">₹{item.price}</div>
                    <div className="quantity-control">
                      <button className="qty-btn" onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}>−</button>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, minWidth: 24, textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button className="qty-btn" onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}>+</button>
                      <button
                        onClick={() => removeItem(item.productId, item.variantId)}
                        style={{ marginLeft: 'auto', color: 'var(--color-error)', fontSize: '0.8rem' }}
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
          <div className="cart-footer">
            {shippingAmount === 0 ? (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600, marginBottom: 'var(--space-3)', textAlign: 'center' }}>
                🎉 You qualify for FREE shipping!
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginBottom: 'var(--space-3)', textAlign: 'center' }}>
                Add ₹{999 - totalAmount} more for FREE shipping
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-gray-500)', marginBottom: 'var(--space-2)' }}>
              <span>Subtotal</span><span>₹{totalAmount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-gray-500)', marginBottom: 'var(--space-4)' }}>
              <span>Shipping</span>
              <span>{shippingAmount === 0 ? <span style={{ color: 'var(--color-success)' }}>FREE</span> : `₹${shippingAmount}`}</span>
            </div>

            <div className="cart-total">
              <span className="cart-total-label">Total</span>
              <span className="cart-total-amount">₹{grandTotal}</span>
            </div>
            <button id="checkout-btn" className="btn btn-gold" style={{ width: '100%' }} onClick={handleCheckout}>
              Proceed to Checkout →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
