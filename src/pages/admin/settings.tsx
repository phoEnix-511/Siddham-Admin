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
};

export default function AdminSettingsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
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
            <SettingSection title="Store Information" icon="🏪">
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
