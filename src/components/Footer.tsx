import React from 'react';
import Link from 'next/link';
import { useSettings } from '@/context/SettingsContext';

export default function Footer() {
  const { storePhone, storeEmail, storeInstagram, storeFacebook } = useSettings();
  const contacts = {
    phone: storePhone,
    email: storeEmail,
    instagram: storeInstagram,
    facebook: storeFacebook,
  };

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
                <a href={contacts.facebook} target="_blank" rel="noopener noreferrer" style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-saffron, #c4852a)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.25s' }} title="Facebook" aria-label="Follow us on Facebook">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style={{ color: '#ffffff' }}>
                    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.938 5.858-5.938 2.378 0 3.128.17 3.128.17v3.32h-2.311c-1.55 0-2.003.95-2.003 2.122v1.897h4.092l-.566 3.667h-3.526v7.98h-4.673z"/>
                  </svg>
                </a>
              )}
              {contacts.instagram && (
                <a href={contacts.instagram} target="_blank" rel="noopener noreferrer" style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-saffron, #c4852a)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.25s' }} title="Instagram" aria-label="Follow us on Instagram">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style={{ color: '#ffffff' }}>
                    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
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
