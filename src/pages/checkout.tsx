import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  modal: { ondismiss: () => void };
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
}

export default function CheckoutPage() {
  const { items, totalAmount, clearCart } = useCart();
  const { addToast } = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    address: '', city: '', state: '', pincode: '',
    notes: '',
  });

  const shippingAmount = totalAmount >= 999 ? 0 : 99;
  const grandTotal = totalAmount + shippingAmount;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { addToast('Your cart is empty', 'error'); return; }

    setLoading(true);
    try {
      // 1. Create order in DB
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.phone,
          shippingAddress: {
            address: form.address,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
          },
          notes: form.notes,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Order creation failed');

      const orderId = orderData.order.id;

      // 2. Create Razorpay payment order
      const rzpRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const rzpData = await rzpRes.json();
      if (!rzpRes.ok) throw new Error(rzpData.error || 'Payment initialization failed');

      // 3. Open Razorpay modal
      const options: RazorpayOptions = {
        key: rzpData.keyId,
        amount: rzpData.amount,
        currency: rzpData.currency,
        name: 'Siddham Wellness',
        description: 'Ayurvedic Products',
        order_id: rzpData.razorpayOrderId,
        handler: async (response: RazorpayResponse) => {
          // 4. Verify payment
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderId,
            }),
          });

          if (verifyRes.ok) {
            clearCart();
            addToast('Payment successful! Order confirmed 🎉', 'success');
            router.push(`/order-success?id=${orderId}`);
          } else {
            addToast('Payment verification failed', 'error');
          }
        },
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: '#18181b' },
        modal: {
          ondismiss: () => { setLoading(false); },
        },
      };

      // Load Razorpay script if not loaded
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Razorpay'));
          document.body.appendChild(script);
        });
      }

      const rzp = new window.Razorpay(options);
      rzp.open();
      setLoading(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      addToast(message, 'error');
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <>
        <Navbar />
        <div className="empty-state" style={{ minHeight: '60vh' }}>
          <div className="empty-state-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <Link href="/shop" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
            Continue Shopping
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Checkout – Siddham Wellness</title>
      </Head>
      <Navbar />

      <section style={{ background: 'var(--color-cream)', padding: 'var(--space-10) 0', minHeight: '80vh' }}>
        <div className="checkout-layout">
          {/* Left - Form */}
          <div>
            <form onSubmit={handlePlaceOrder}>
              <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
                <div className="card-body">
                  <div className="checkout-section-title">📦 Contact Information</div>
                  <div className="grid-2" style={{ gap: 'var(--space-4)' }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="checkout-name">Full Name *</label>
                      <input id="checkout-name" className="form-input" name="name" required value={form.name} onChange={handleChange} placeholder="Your full name" />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="checkout-email">Email *</label>
                      <input id="checkout-email" className="form-input" name="email" type="email" required value={form.email} onChange={handleChange} placeholder="your@email.com" />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="checkout-phone">Phone *</label>
                      <input id="checkout-phone" className="form-input" name="phone" required value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
                <div className="card-body">
                  <div className="checkout-section-title">🏠 Shipping Address</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="checkout-address">Street Address *</label>
                      <input id="checkout-address" className="form-input" name="address" required value={form.address} onChange={handleChange} placeholder="House no., Street, Area" />
                    </div>
                    <div className="grid-3" style={{ gap: 'var(--space-4)' }}>
                      <div className="form-group">
                        <label className="form-label" htmlFor="checkout-city">City *</label>
                        <input id="checkout-city" className="form-input" name="city" required value={form.city} onChange={handleChange} placeholder="City" />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="checkout-state">State *</label>
                        <input id="checkout-state" className="form-input" name="state" required value={form.state} onChange={handleChange} placeholder="State" />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="checkout-pincode">Pincode *</label>
                        <input id="checkout-pincode" className="form-input" name="pincode" required value={form.pincode} onChange={handleChange} placeholder="400001" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="checkout-notes">Order Notes</label>
                      <textarea id="checkout-notes" className="form-textarea" name="notes" value={form.notes} onChange={handleChange} placeholder="Any special instructions?" rows={3} />
                    </div>
                  </div>
                </div>
              </div>

              <button id="place-order-btn" type="submit" className="btn btn-gold btn-lg" disabled={loading} style={{ width: '100%' }}>
                {loading ? '⏳ Processing...' : '🔒 Pay with Razorpay →'}
              </button>
            </form>
          </div>

          {/* Right - Order Summary */}
          <div>
            <div className="order-summary-card">
              <div style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--color-gray-100)' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-forest-dark)' }}>
                  Order Summary
                </h3>
              </div>
              <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
                {items.map(item => (
                  <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-gray-100)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-forest-dark)' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>Qty: {item.quantity}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--color-forest)', fontSize: '0.875rem' }}>
                      ₹{item.price * item.quantity}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: 'var(--space-4) var(--space-5)', background: 'var(--color-parchment)', borderTop: '1px solid var(--color-gray-100)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--color-gray-600)', marginBottom: 'var(--space-2)' }}>
                  <span>Subtotal</span><span>₹{totalAmount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--color-gray-600)', marginBottom: 'var(--space-4)' }}>
                  <span>Shipping</span>
                  <span style={{ color: shippingAmount === 0 ? 'var(--color-success)' : undefined }}>
                    {shippingAmount === 0 ? 'FREE' : `₹${shippingAmount}`}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--color-forest-dark)' }}>Total</span>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--color-forest)' }}>₹{grandTotal}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--color-gray-500)' }}>
              <span>🔒 SSL Secured</span>
              <span>🛡️ 100% Safe</span>
              <span>✅ Verified by Razorpay</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
