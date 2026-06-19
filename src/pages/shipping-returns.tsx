import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ShippingReturnsPage() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        if (d.settings && d.settings.shipping_returns_content) {
          setContent(d.settings.shipping_returns_content);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <Head>
        <title>Shipping & Returns – Siddham Wellness</title>
        <meta name="description" content="Shipping policy and Return procedures for Siddham Wellness." />
      </Head>
      <Navbar />

      <div className="page-header">
        <div className="container">
          <h1>Shipping & Returns</h1>
          <p>Everything you need to know about deliveries and returns</p>
        </div>
      </div>

      <section className="section" style={{ background: 'var(--color-cream)' }}>
        <div className="container">
          <div style={{ maxWidth: 800, margin: '0 auto', background: 'var(--color-white)', padding: 'var(--space-8) var(--space-10)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-gray-100)' }}>
            {loading ? (
              <div className="loading-page" style={{ minHeight: '20vh' }}><div className="spinner" /></div>
            ) : content ? (
              <div
                className="cms-content"
                style={{ lineHeight: 1.8 }}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              <p style={{ color: 'var(--color-gray-400)', textAlign: 'center', fontStyle: 'italic' }}>
                Shipping and Returns policies have not been set yet.
              </p>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
