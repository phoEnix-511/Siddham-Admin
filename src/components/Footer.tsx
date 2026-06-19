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
                <a href={contacts.facebook} target="_blank" rel="noopener noreferrer" style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(196,133,42,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', transition: 'background 0.25s' }} title="Facebook">
                  📘
                </a>
              )}
              {contacts.instagram && (
                <a href={contacts.instagram} target="_blank" rel="noopener noreferrer" style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(196,133,42,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', transition: 'background 0.25s' }} title="Instagram">
                  📸
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
              <span className="footer-link" style={{ opacity: 0.5, cursor: 'default' }}>Ayurveda Blog</span>
              <span className="footer-link" style={{ opacity: 0.5, cursor: 'default' }}>Sustainability</span>
            </div>
          </div>

          <div>
            <div className="footer-heading">Support & Info</div>
            <div className="footer-links">
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
