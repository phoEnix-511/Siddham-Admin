import React from 'react';
import Link from 'next/link';

export default function Footer() {
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
              {['📘', '📸', '🐦', '▶️'].map((icon, i) => (
                <a key={i} href="#" style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(196,133,42,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', transition: 'background 0.25s' }}>
                  {icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <div className="footer-heading">Shop</div>
            <div className="footer-links">
              <Link href="/shop" className="footer-link">All Products</Link>
              <Link href="/shop?category=hair-care" className="footer-link">Hair Care</Link>
              <Link href="/shop?category=supplements" className="footer-link">Supplements</Link>
              <Link href="/shop?category=skin-care" className="footer-link">Skin Care</Link>
              <Link href="/shop?category=oils-essentials" className="footer-link">Oils & Essentials</Link>
            </div>
          </div>

          <div>
            <div className="footer-heading">Company</div>
            <div className="footer-links">
              <Link href="/about" className="footer-link">Our Story</Link>
              <a href="#" className="footer-link">Ayurveda Blog</a>
              <a href="#" className="footer-link">Sustainability</a>
              <a href="#" className="footer-link">Certifications</a>
              <a href="#" className="footer-link">Careers</a>
            </div>
          </div>

          <div>
            <div className="footer-heading">Support</div>
            <div className="footer-links">
              <a href="#" className="footer-link">📞 +91 98765 43210</a>
              <a href="#" className="footer-link">✉️ hello@siddhamwellness.com</a>
              <a href="#" className="footer-link">Shipping Policy</a>
              <a href="#" className="footer-link">Return Policy</a>
              <a href="#" className="footer-link">Privacy Policy</a>
              <a href="#" className="footer-link">Terms of Service</a>
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
