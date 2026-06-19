import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/AdminLayout';
import { useToast } from '@/context/ToastContext';

interface Settings {
  // Payment
  razorpay_key_id: string;
  razorpay_key_secret: string;
  // Store
  store_name: string;
  store_email: string;
  store_phone: string;
  // Shipping
  free_shipping_threshold: string;
  shipping_charge: string;
  // Inventory
  low_stock_threshold: string;
  // CMS Content
  announcement_bar_text: string;
  announcement_bar_active: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image: string;
  social_instagram: string;
  social_facebook: string;
  about_us_content: string;
  privacy_policy_content: string;
  terms_conditions_content: string;
  shipping_returns_content: string;
}

const defaultSettings: Settings = {
  razorpay_key_id: '',
  razorpay_key_secret: '',
  store_name: 'Siddham Wellness',
  store_email: '',
  store_phone: '',
  free_shipping_threshold: '999',
  shipping_charge: '99',
  low_stock_threshold: '10',
  announcement_bar_text: 'Free Shipping on orders above ₹999! 🌿',
  announcement_bar_active: 'true',
  hero_title: 'Ancient Wisdom, Modern Wellness',
  hero_subtitle: '100% Pure, Organic Ayurvedic Tonics & Formulations for your daily care.',
  hero_image: '',
  social_instagram: '',
  social_facebook: '',
  about_us_content: '<h2>Our Journey</h2><p>Welcome to Siddham Wellness, where ancient Ayurvedic traditions meet modern lifestyle needs. Our journey began with a simple mission: to make pure, authentic, and effective Ayurvedic remedies accessible to everyone.</p><h3>Why Choose Siddham?</h3><p>We source the finest organic herbs from sustainable farms across India. Each formulation is prepared following classical texts and manufactured in GMP-certified facilities to ensure the highest standards of safety and efficacy.</p>',
  privacy_policy_content: '<h2>Privacy Policy</h2><p>Your privacy is important to us. This Privacy Policy explains how Siddham Wellness collects, uses, and protects your personal data when you visit our website or make a purchase.</p><p>We collect information such as your name, email address, phone number, shipping address, and payment details to process your orders and provide a personalized shopping experience.</p>',
  terms_conditions_content: '<h2>Terms and Conditions</h2><p>Welcome to Siddham Wellness. By accessing or using our website, you agree to comply with and be bound by the following terms and conditions of use.</p><p>All products, pricing, and availability are subject to change without notice. We reserve the right to cancel any order if we detect suspicious or fraudulent activity.</p>',
  shipping_returns_content: '<h2>Shipping & Returns</h2><h3>Shipping Policy</h3><p>We offer free standard shipping on all orders above ₹999. For orders below this threshold, a flat shipping fee of ₹99 is charged. Orders are typically processed within 24-48 hours and delivered in 3-5 business days.</p><h3>Returns & Exchange Policy</h3><p>Due to the personal and health nature of Ayurvedic products, we do not accept returns. However, if you receive a damaged or incorrect product, please contact us at support@siddhamwellness.com within 48 hours of delivery with photos of the package, and we will send a free replacement.</p>',
};

export default function AdminSettingsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [downloadingBackup, setDownloadingBackup] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/settings');
      if (res.status === 401) { router.push('/admin/login'); return; }
      const data = await res.json();
      if (data.settings) {
        setSettings(prev => ({ ...prev, ...data.settings }));
      }
      setLoading(false);
    };
    load();
  }, [router]);

  const handleDownloadBackup = async () => {
    setDownloadingBackup(true);
    try {
      const res = await fetch('/api/admin/backup');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!res.ok) throw new Error('Backup failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `siddham-db-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      addToast('Database backup downloaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to download backup', 'error');
    } finally {
      setDownloadingBackup(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        addToast('Image size should be less than 2MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, hero_image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      if (!res.ok) throw new Error('Failed to save settings');
      addToast('Settings saved successfully!', 'success');
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Save failed', 'error');
    }
    setSaving(false);
  };

  if (loading) return <AdminLayout title="Settings"><div className="loading-page"><div className="spinner" /></div></AdminLayout>;

  const SettingSection = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
    <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
      <div className="card-header">
        <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-forest-dark)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {icon} {title}
        </h3>
      </div>
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {children}
      </div>
    </div>
  );

  return (
    <>
      <Head><title>Settings – Siddham Wellness Admin</title></Head>
      <AdminLayout title="Settings">
        <form onSubmit={handleSave}>
          <div style={{ maxWidth: 720 }}>
            {/* Announcement Bar */}
            <SettingSection title="Announcement Bar" icon="📣">
              <div className="grid-2" style={{ gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="ann-bar-status">Announcement Bar Status</label>
                  <select
                    id="ann-bar-status"
                    className="form-input"
                    name="announcement_bar_active"
                    value={settings.announcement_bar_active}
                    onChange={handleChange}
                  >
                    <option value="true">Active (Visible)</option>
                    <option value="false">Inactive (Hidden)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="ann-bar-text">Announcement Text</label>
                  <input
                    id="ann-bar-text"
                    className="form-input"
                    name="announcement_bar_text"
                    value={settings.announcement_bar_text}
                    onChange={handleChange}
                    placeholder="E.g., Free Shipping on orders above ₹999!"
                  />
                </div>
              </div>
            </SettingSection>

            {/* Storefront Hero Management */}
            <SettingSection title="Hero Banner Management" icon="🖼️">
              <div className="form-group">
                <label className="form-label" htmlFor="hero-title">Hero Title</label>
                <input
                  id="hero-title"
                  className="form-input"
                  name="hero_title"
                  value={settings.hero_title}
                  onChange={handleChange}
                  placeholder="Ancient Wisdom, Modern Wellness"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="hero-sub">Hero Subtitle</label>
                <textarea
                  id="hero-sub"
                  className="form-input"
                  name="hero_subtitle"
                  value={settings.hero_subtitle}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Tell customers about your Ayurvedic tonics & formulations"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="hero-img-upload">Hero Background Image</label>
                <input
                  id="hero-img-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'block', marginTop: 4 }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
                  Upload a high-quality landscape image (Max 2MB)
                </span>
                {settings.hero_image && (
                  <div style={{ marginTop: 'var(--space-2)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: 4 }}>Current Preview:</div>
                    <img
                      src={settings.hero_image}
                      alt="Hero Background Preview"
                      style={{ maxHeight: 150, width: '100%', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--color-error)', marginTop: 'var(--space-1)' }}
                      onClick={() => setSettings(prev => ({ ...prev, hero_image: '' }))}
                    >
                      Remove Hero Image
                    </button>
                  </div>
                )}
              </div>
            </SettingSection>

            {/* Payment Gateway */}
            <SettingSection title="Razorpay Configuration" icon="💳">
              <div style={{ background: 'var(--color-warning-bg)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)', fontSize: '0.8rem', color: 'var(--color-warning)', display: 'flex', gap: 'var(--space-2)' }}>
                <span>⚠️</span>
                <span>Keep your API keys secure. Never share them publicly. You can get these from your <a href="https://dashboard.razorpay.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>Razorpay Dashboard</a>.</span>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="rzp-key-id">Razorpay Key ID (Publishable)</label>
                <input
                  id="rzp-key-id"
                  className="form-input"
                  name="razorpay_key_id"
                  value={settings.razorpay_key_id}
                  onChange={handleChange}
                  placeholder="rzp_live_xxxxxxxxxxxx"
                  style={{ fontFamily: 'monospace' }}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: 4 }}>
                  Use rzp_test_... for testing, rzp_live_... for production
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="rzp-secret">Razorpay Key Secret</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="rzp-secret"
                    className="form-input"
                    name="razorpay_key_secret"
                    type={showSecret ? 'text' : 'password'}
                    value={settings.razorpay_key_secret}
                    onChange={handleChange}
                    placeholder="Your secret key"
                    style={{ fontFamily: 'monospace', paddingRight: '3rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray-400)',
                    }}
                  >
                    {showSecret ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            </SettingSection>

            {/* Store Info */}
            <SettingSection title="Store Information & Socials" icon="🏪">
              <div className="form-group">
                <label className="form-label" htmlFor="store-name">Store Name</label>
                <input id="store-name" className="form-input" name="store_name" value={settings.store_name} onChange={handleChange} />
              </div>
              <div className="grid-2" style={{ gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="store-email">Contact Email</label>
                  <input id="store-email" className="form-input" name="store_email" type="email" value={settings.store_email} onChange={handleChange} placeholder="hello@siddhamwellness.com" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="store-phone">Contact Phone</label>
                  <input id="store-phone" className="form-input" name="store_phone" value={settings.store_phone} onChange={handleChange} placeholder="+91 98765 43210" />
                </div>
              </div>
              <div className="grid-2" style={{ gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="social-ig">Instagram Profile URL</label>
                  <input id="social-ig" className="form-input" name="social_instagram" value={settings.social_instagram} onChange={handleChange} placeholder="https://instagram.com/siddhamwellness" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="social-fb">Facebook Page URL</label>
                  <input id="social-fb" className="form-input" name="social_facebook" value={settings.social_facebook} onChange={handleChange} placeholder="https://facebook.com/siddhamwellness" />
                </div>
              </div>
            </SettingSection>

            {/* Shipping */}
            <SettingSection title="Shipping Configuration" icon="🚚">
              <div className="grid-2" style={{ gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="free-ship-threshold">Free Shipping Threshold (₹)</label>
                  <input id="free-ship-threshold" className="form-input" name="free_shipping_threshold" type="number" value={settings.free_shipping_threshold} onChange={handleChange} />
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: 4 }}>Orders above this amount get free shipping</div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="ship-charge">Shipping Charge (₹)</label>
                  <input id="ship-charge" className="form-input" name="shipping_charge" type="number" value={settings.shipping_charge} onChange={handleChange} />
                </div>
              </div>
            </SettingSection>

            {/* Inventory */}
            <SettingSection title="Inventory Settings" icon="📦">
              <div className="form-group" style={{ maxWidth: 240 }}>
                <label className="form-label" htmlFor="low-stock-threshold">Low Stock Alert Threshold</label>
                <input id="low-stock-threshold" className="form-input" name="low_stock_threshold" type="number" value={settings.low_stock_threshold} onChange={handleChange} />
                <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: 4 }}>
                  Products at or below this stock level will trigger a low stock alert
                </div>
              </div>
            </SettingSection>

            {/* Dynamic Pages Content */}
            <SettingSection title="Dynamic CMS Page Editors (HTML Supported)" icon="📝">
              <div className="form-group">
                <label className="form-label" htmlFor="about-content">About Us Page Content</label>
                <textarea
                  id="about-content"
                  className="form-input"
                  name="about_us_content"
                  value={settings.about_us_content}
                  onChange={handleChange}
                  rows={8}
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="privacy-content">Privacy Policy Page Content</label>
                <textarea
                  id="privacy-content"
                  className="form-input"
                  name="privacy_policy_content"
                  value={settings.privacy_policy_content}
                  onChange={handleChange}
                  rows={8}
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="terms-content">Terms & Conditions Page Content</label>
                <textarea
                  id="terms-content"
                  className="form-input"
                  name="terms_conditions_content"
                  value={settings.terms_conditions_content}
                  onChange={handleChange}
                  rows={8}
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="shipping-content">Shipping & Returns Page Content</label>
                <textarea
                  id="shipping-content"
                  className="form-input"
                  name="shipping_returns_content"
                  value={settings.shipping_returns_content}
                  onChange={handleChange}
                  rows={8}
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                />
              </div>
            </SettingSection>

            {/* Database Backup */}
            <SettingSection title="Database & Backups" icon="📂">
              <div style={{ fontSize: '0.85rem', color: 'var(--color-gray-600)', marginBottom: 'var(--space-2)' }}>
                Download a complete copy of your database including categories, products, customer records, settings, and orders as a secure JSON file. You can store this backup file locally for safety.
              </div>
              <div style={{ marginTop: 'var(--space-2)' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleDownloadBackup}
                  disabled={downloadingBackup}
                >
                  {downloadingBackup ? '⏳ Exporting...' : '📥 Download Database Backup (JSON)'}
                </button>
              </div>
            </SettingSection>

            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button id="save-settings-btn" type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? '⏳ Saving...' : '💾 Save Settings'}
              </button>
            </div>
          </div>
        </form>
      </AdminLayout>
    </>
  );
}
