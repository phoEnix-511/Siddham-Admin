import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Footer() {
  const [contacts, setContacts] = useState({
    phone: '+91 98765 43210',
    email: 'hello@siddhamwellness.com',
    instagram: '',
    facebook: '',
  });

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setContacts({
            phone: data.settings.store_phone || '+91 98765 43210',
            email: data.settings.store_email || 'hello@siddhamwellness.com',
            instagram: data.settings.social_instagram || '',
            facebook: data.settings.social_facebook || '',
          });
        }
      })
      .catch(err => console.error('Error fetching settings for Footer:', err));
  }, []);

  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand-name">Siddham Wellness</div>
            <div className="footer-tagline">Ancient Wisdom · Modern Wellness</div>
            <p className="footer-desc">
              Rooted in the 5,000-year tradition of Ayurveda, Siddham Wellness brings you
              the finest herbal formulations crafted with pure ingredients for holistic wellbeing.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              {contacts.facebook && (
                <a href={contacts.facebook} target="_blank" rel="noopener noreferrer" style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(196,133,42,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.25s' }} title="Facebook" aria-label="Follow us on Facebook">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style={{ color: 'var(--color-forest-dark)' }}>
                    <path d="M13.5 20v-7h2.3l.3-2.7h-2.6V3.8c0-.7.2-1.3 1.2-1.3h1.3V.1c-.2 0-1 .1-2 .1-2 0-3.4 1.2-3.4 3.5v2h-2.3V13h2.3v7h2.8z"/>
                  </svg>
                </a>
              )}
              {contacts.instagram && (
                <a href={contacts.instagram} target="_blank" rel="noopener noreferrer" style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(196,133,42,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.25s' }} title="Instagram" aria-label="Follow us on Instagram">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style={{ color: 'var(--color-forest-dark)' }}>
                    <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5zm5.25-3.25a1 1 0 1 1-1 1 1 1 0 0 1 1-1z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>

          <div>
            <div className="footer-heading">Shop</div>
            <div className="footer-links">
              <Link href="/shop" className="footer-link">All Products</Link>
              <Link href="/shop?category=hair-care" className="footer-link">Hair Care</Link>
              <Link href="/shop?category=supplements" className="footer-link">Supplements</Link>
              <Link href="/shop?category=skin-care" className="footer-link">Skin Care</Link>
            </div>
          </div>

          <div>
            <div className="footer-heading">Company</div>
            <div className="footer-links">
              <Link href="/about" className="footer-link">Our Story</Link>
            </div>
          </div>

          <div>
            <div className="footer-heading">Quick Links</div>
            <div className="footer-links quick-links">
              <a href={`tel:${contacts.phone}`} className="footer-link">📞 {contacts.phone}</a>
              <a href={`mailto:${contacts.email}`} className="footer-link">✉️ {contacts.email}</a>
              <Link href="/shipping-returns" className="footer-link">Shipping Policy</Link>
              <Link href="/shipping-returns" className="footer-link">Return Policy</Link>
              <Link href="/privacy" className="footer-link">Privacy Policy</Link>
              <Link href="/terms" className="footer-link">Terms of Service</Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Siddham Wellness Pvt. Ltd. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span>🔒 SSL Secured</span>
            <span>🏆 ISO Certified</span>
            <span>🌿 100% Natural</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
