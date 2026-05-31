import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function OrderSuccessPage() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState<{ orderNumber: string; totalAmount: number } | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/orders/${id}`)
      .then(r => r.json())
      .then(d => setOrder(d.order));
  }, [id]);

  return (
    <>
      <Head>
        <title>Order Confirmed – Siddham Wellness</title>
      </Head>
      <Navbar />

      <section style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', background: 'var(--color-cream)', padding: 'var(--space-16) 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '5rem', marginBottom: 'var(--space-6)' }}>🎉</div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', color: 'var(--color-forest-dark)', marginBottom: 'var(--space-4)' }}>
            Order Confirmed!
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--color-gray-600)', marginBottom: 'var(--space-4)' }}>
            Thank you for choosing Siddham Wellness. Your Ayurvedic journey begins now.
          </p>

          {order && (
            <div style={{
              display: 'inline-block',
              background: 'var(--color-white)',
              border: '1px solid var(--color-gray-200)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-6) var(--space-10)',
              margin: 'var(--space-6) 0',
            }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Order Number
              </div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-forest)', margin: '0.25rem 0' }}>
                {order.orderNumber}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>
                Total: ₹{order.totalAmount}
              </div>
            </div>
          )}

          <p style={{ color: 'var(--color-gray-500)', marginBottom: 'var(--space-8)' }}>
            A confirmation email has been sent. Your order will be delivered within 3–7 business days.
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/shop" className="btn btn-primary btn-lg">
              Continue Shopping
            </Link>
            <Link href="/" className="btn btn-outline btn-lg">
              Back to Home
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
