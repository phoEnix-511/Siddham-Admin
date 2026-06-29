import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import dynamic from 'next/dynamic';
import type { LocationData } from '@/components/MapPicker';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

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

type CheckoutStep = 'ADDRESS' | 'REVIEW';

export default function CheckoutPage() {
  const { items, totalAmount, clearCart } = useCart();
  const { addToast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState<CheckoutStep>('ADDRESS');
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    flatHouseBuilding: '',
    address: '', city: '', state: '', pincode: '',
    notes: '',
  });

  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const shippingAmount = totalAmount >= 999 ? 0 : totalAmount > 0 ? 99 : 0;
  const grandTotal = totalAmount + shippingAmount;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (e.target.name === 'phone' && isPhoneVerified) {
      // If they change phone after verified, unverify them
      setIsPhoneVerified(false);
      setOtpSent(false);
      setOtp('');
    }
  };

  const handleLocationSelect = (loc: LocationData) => {
    setForm(prev => ({
      ...prev,
      address: loc.address || prev.address,
      city: loc.city || prev.city,
      state: loc.state || prev.state,
      pincode: loc.pincode || prev.pincode,
    }));
  };

  const handleSendOtp = async () => {
    if (!form.phone.match(/^[6-9]\d{9}$/)) {
      addToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      
      setOtpSent(true);
      addToast('OTP sent to your WhatsApp', 'success');
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      addToast('OTP must be 6 digits', 'error');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');
      
      setIsPhoneVerified(true);
      addToast('Phone number verified!', 'success');
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setOtpLoading(false);
    }
  };

  const proceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPhoneVerified) {
      addToast('Please verify your phone number to continue', 'error');
      return;
    }
    setStep('REVIEW');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) { addToast('Your cart is empty', 'error'); return; }

    setLoading(true);
    try {
      // 1. Create Razorpay payment order first
      const rzpRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: grandTotal,
          receipt: `rcpt_${Date.now()}`,
        }),
      });
      const rzpData = await rzpRes.json();
      if (!rzpRes.ok) throw new Error(rzpData.error || 'Payment initialization failed');

      // 2. Open Razorpay modal
      const options: RazorpayOptions = {
        key: rzpData.keyId,
        amount: rzpData.amount,
        currency: rzpData.currency,
        name: 'Siddham Wellness',
        description: 'Ayurvedic Products',
        order_id: rzpData.razorpayOrderId,
        handler: async (response: RazorpayResponse) => {
          // 3. Verify payment and create order
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              items: items.map(i => ({
                productId: i.productId,
                variantId: i.variantId || null,
                quantity: i.quantity,
              })),
              customerName: form.name,
              customerEmail: form.email,
              customerPhone: form.phone,
              shippingAddress: {
                address: form.flatHouseBuilding ? `${form.flatHouseBuilding}, ${form.address}` : form.address,
                city: form.city,
                state: form.state,
                pincode: form.pincode,
              },
              notes: form.notes,
            }),
          });

          if (verifyRes.ok) {
            const verifyData = await verifyRes.json();
            clearCart();
            addToast('Payment successful! Order confirmed 🎉', 'success');
            router.push(`/order-success?id=${verifyData.order.id}`);
          } else {
            const verifyData = await verifyRes.json();
            addToast(verifyData.error || 'Payment verification failed', 'error');
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

      <section style={{ background: 'var(--color-cream)', padding: 'var(--space-8) 0', minHeight: '80vh' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          
          {/* Step Indicator */}
          <div className="step-indicator">
            <div className={`step-item ${step === 'ADDRESS' ? 'step-active' : 'step-completed'}`}>
              <div className="step-circle">1</div>
              <div className="step-label">Address</div>
            </div>
            <div className={`step-item ${step === 'REVIEW' ? 'step-active' : ''}`}>
              <div className="step-circle">2</div>
              <div className="step-label">Review & Pay</div>
            </div>
          </div>

          {step === 'ADDRESS' && (
            <div className="card">
              <div className="card-body">
                <h2 className="checkout-section-title">📍 Pin Your Location</h2>
                <p style={{ color: 'var(--color-gray-500)', fontSize: '0.85rem', marginBottom: 'var(--space-4)' }}>
                  Tap the map or use the Current Location button to auto-fill your delivery details.
                </p>
                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <MapPicker onLocationSelect={handleLocationSelect} />
                </div>

                <form onSubmit={proceedToReview}>
                  <div className="checkout-section-title">📦 Contact Details</div>
                  
                  <div className="grid-2" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                    <div className="form-group">
                      <label className="form-label">Full Name *</label>
                      <input className="form-input" name="name" required value={form.name} onChange={handleChange} placeholder="Your full name" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email *</label>
                      <input className="form-input" name="email" type="email" required value={form.email} onChange={handleChange} placeholder="your@email.com" />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                    <label className="form-label">Mobile Number *</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        className="form-input" 
                        name="phone" 
                        required 
                        value={form.phone} 
                        onChange={handleChange} 
                        placeholder="10-digit mobile number" 
                        maxLength={10}
                        style={{ flex: 1 }}
                        readOnly={isPhoneVerified}
                      />
                      {!isPhoneVerified && (
                        <button 
                          type="button" 
                          className="btn btn-outline" 
                          onClick={handleSendOtp}
                          disabled={otpLoading || form.phone.length !== 10}
                        >
                          {otpLoading ? 'Sending...' : otpSent ? 'Resend OTP' : 'Verify'}
                        </button>
                      )}
                      {isPhoneVerified && (
                        <div style={{ display: 'flex', alignItems: 'center', color: 'var(--color-success)', padding: '0 12px', background: 'var(--color-success-bg)', borderRadius: '6px', fontWeight: 600 }}>
                          ✓ Verified
                        </div>
                      )}
                    </div>
                  </div>

                  {otpSent && !isPhoneVerified && (
                    <div className="form-group" style={{ background: 'var(--color-saffron-pale)', padding: 'var(--space-4)', borderRadius: '8px', marginBottom: 'var(--space-4)' }}>
                      <label className="form-label">Enter 6-digit OTP sent to WhatsApp *</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          className="form-input" 
                          type="text" 
                          maxLength={6} 
                          value={otp} 
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} 
                          placeholder="••••••" 
                          style={{ flex: 1, letterSpacing: '0.5em', fontSize: '1.2rem', textAlign: 'center' }}
                        />
                        <button 
                          type="button" 
                          className="btn btn-primary" 
                          onClick={handleVerifyOtp}
                          disabled={otpLoading || otp.length !== 6}
                        >
                          {otpLoading ? 'Verifying...' : 'Submit OTP'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                    <label className="form-label">Flat, House No., Building, Society *</label>
                    <input className="form-input" name="flatHouseBuilding" required value={form.flatHouseBuilding} onChange={handleChange} placeholder="e.g. Flat 402, Block B, Sunshine Apartments" />
                  </div>

                  <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                    <label className="form-label">Area, Landmark & Street (from Map / Search) *</label>
                    <textarea className="form-input" name="address" required value={form.address} onChange={handleChange} rows={2} placeholder="e.g. Near Apollo Pharmacy, Bannerghatta Road" />
                  </div>

                  <div className="grid-2" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                    <div className="form-group">
                      <label className="form-label">City *</label>
                      <input className="form-input" name="city" required value={form.city} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">State *</label>
                      <input className="form-input" name="state" required value={form.state} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Pincode *</label>
                      <input className="form-input" name="pincode" required value={form.pincode} onChange={handleChange} />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: '1.1rem', padding: '16px' }} disabled={!isPhoneVerified}>
                    Proceed to Review {isPhoneVerified ? '→' : '(Verify Phone First)'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {step === 'REVIEW' && (
            <div className="grid-2" style={{ gap: 'var(--space-6)', alignItems: 'start', gridTemplateColumns: '1fr 350px' }}>
              {/* Left Column: Review Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                
                <div className="card">
                  <div className="card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                      <h2 className="checkout-section-title" style={{ margin: 0 }}>Delivery Details</h2>
                      <button className="btn btn-sm btn-outline" onClick={() => setStep('ADDRESS')}>Edit</button>
                    </div>
                    <p style={{ margin: '0 0 4px', fontWeight: 600 }}>{form.name} • {form.phone}</p>
                    <p style={{ margin: 0, color: 'var(--color-gray-600)', fontSize: '0.9rem' }}>
                      {form.flatHouseBuilding && `${form.flatHouseBuilding}, `}{form.address}<br />
                      {form.city}, {form.state} - {form.pincode}
                    </p>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <h2 className="checkout-section-title">Order Items</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      {items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 'var(--space-3)', borderBottom: idx !== items.length - 1 ? '1px solid var(--color-gray-100)' : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            <div style={{ fontSize: '1.5rem' }}>🌿</div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)' }}>Qty: {item.quantity} {item.variantName ? `| ${item.variantName}` : ''}</div>
                            </div>
                          </div>
                          <div style={{ fontWeight: 700 }}>₹{item.price * item.quantity}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Order Summary & Pay */}
              <div className="card" style={{ position: 'sticky', top: '100px' }}>
                <div className="card-body">
                  <h2 className="checkout-section-title">Order Summary</h2>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <span style={{ color: 'var(--color-gray-600)' }}>Subtotal</span>
                    <span style={{ fontWeight: 600 }}>₹{totalAmount}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-4)', borderBottom: '1px dashed var(--color-gray-200)' }}>
                    <span style={{ color: 'var(--color-gray-600)' }}>Shipping</span>
                    <span style={{ fontWeight: 600 }}>{shippingAmount === 0 ? 'FREE' : `₹${shippingAmount}`}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-6)', fontSize: '1.25rem' }}>
                    <span style={{ fontWeight: 800 }}>Total</span>
                    <span style={{ fontWeight: 800, color: 'var(--color-forest)' }}>₹{grandTotal}</span>
                  </div>

                  <button 
                    className="btn btn-primary" 
                    onClick={handlePlaceOrder} 
                    disabled={loading}
                    style={{ width: '100%', fontSize: '1.1rem', padding: '16px' }}
                  >
                    {loading ? 'Processing...' : `Pay ₹${grandTotal}`}
                  </button>
                  <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: 'var(--space-3)' }}>
                    🔒 Secure payments powered by Razorpay
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>
      <Footer />
    </>
  );
}
