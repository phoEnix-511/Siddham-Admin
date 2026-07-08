import React, { createContext, useContext, useEffect, useState } from 'react';

interface SiteSettings {
  catalogMode: boolean;
  freeShippingThreshold: number;
  shippingCharge: number;
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeInstagram: string;
  storeFacebook: string;
  trustBarRating: string;
  trustBarCount: string;
  raw: Record<string, string>;
}

const defaultSettings: SiteSettings = {
  catalogMode: false,
  freeShippingThreshold: 999,
  shippingCharge: 99,
  storeName: 'Siddham Wellness',
  storeEmail: 'hello@siddhamwellness.com',
  storePhone: '+91 83198 77420',
  storeInstagram: '',
  storeFacebook: '',
  trustBarRating: '4.8',
  trustBarCount: '50,000+',
  raw: {},
};

const SettingsContext = createContext<SiteSettings>(defaultSettings);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          const raw: Record<string, string> = data.settings;
          setSettings({
            catalogMode: raw.catalog_mode === 'true',
            freeShippingThreshold: parseFloat(raw.free_shipping_threshold || '999'),
            shippingCharge: parseFloat(raw.shipping_charge || '99'),
            storeName: raw.store_name || 'Siddham Wellness',
            storeEmail: raw.store_email || 'hello@siddhamwellness.com',
            storePhone: raw.store_phone || '+91 83198 77420',
            storeInstagram: raw.store_instagram || '',
            storeFacebook: raw.store_facebook || '',
            trustBarRating: raw.trust_bar_rating || '4.8',
            trustBarCount: raw.trust_bar_count || '50,000+',
            raw,
          });
        }
      })
      .catch(() => {
        // Keep default settings on error — site still works
      });
  }, []);

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SiteSettings {
  return useContext(SettingsContext);
}

