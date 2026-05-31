import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>Our Story – Siddham Wellness</title>
        <meta name="description" content="Learn about Siddham Wellness — our mission, philosophy, and commitment to authentic Ayurveda." />
      </Head>
      <Navbar />

      <div className="page-header">
        <div className="container">
          <h1>Our Story</h1>
          <p>Rooted in tradition, growing with purpose</p>
        </div>
      </div>

      <section className="section" style={{ background: 'var(--color-cream)' }}>
        <div className="container">
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <span className="section-eyebrow">Who We Are</span>
            <h2 style={{ marginTop: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
              Ancient Wisdom, Thoughtfully Reimagined
            </h2>
            <p style={{ lineHeight: 1.9, marginBottom: 'var(--space-5)', fontSize: '1rem' }}>
              Siddham Wellness was born from a simple belief: that the answers to modern health challenges
              lie in nature's own pharmacy. Founded in the heartland of India, our brand draws inspiration
              from the ancient Siddha and Ayurvedic traditions — systems of medicine that have stood the
              test of time for over 5,000 years.
            </p>
            <p style={{ lineHeight: 1.9, marginBottom: 'var(--space-5)', fontSize: '1rem' }}>
              Our founders, having witnessed firsthand the transformative power of herbal remedies in their
              own families, set out to make these ancient formulations accessible to the modern world.
              We work closely with certified organic farmers across India to source the finest ingredients,
              ensuring every product we create is pure, potent, and respectful of the earth.
            </p>
            <p style={{ lineHeight: 1.9, fontSize: '1rem' }}>
              Today, Siddham Wellness is a trusted name for those who seek holistic wellness — not just
              treating symptoms, but nurturing the whole person. We are GMP certified, and every
              batch is third-party lab tested for purity and efficacy.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-6)', marginTop: 'var(--space-12)' }}>
            {[
              { icon: '🌱', title: 'Sustainable Sourcing', desc: 'We partner with organic farmers who practice ethical, sustainable cultivation.' },
              { icon: '🔬', title: 'Science-Backed', desc: 'Every formulation is validated by modern science and Ayurvedic wisdom.' },
              { icon: '💚', title: 'No Harmful Chemicals', desc: 'All our products are free from parabens, sulfates, and synthetic additives.' },
            ].map((v, i) => (
              <div key={i} className="card">
                <div className="card-body" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-4)' }}>{v.icon}</div>
                  <h4 style={{ color: 'var(--color-forest-dark)', marginBottom: 'var(--space-3)' }}>{v.title}</h4>
                  <p style={{ fontSize: '0.875rem' }}>{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
