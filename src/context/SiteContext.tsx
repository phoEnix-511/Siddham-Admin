import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Category } from '@/lib/constants';

interface SiteSettings {
  // Hero
  hero_title?: string;
  hero_subtitle?: string;
  hero_image?: string;
  // Announcement
  announcement_bar_active?: string;
  announcement_bar_text?: string;
  // Contact / Social
  store_phone?: string;
  store_email?: string;
  social_instagram?: string;
  social_facebook?: string;
  // CMS content
  about_us_content?: string;
  privacy_policy_content?: string;
  terms_of_service_content?: string;
  shipping_returns_content?: string;
  [key: string]: string | undefined;
}

interface SiteContextType {
  settings: SiteSettings;
  categories: Category[];
  loading: boolean;
}

const SiteContext = createContext<SiteContextType>({
  settings: {},
  categories: [],
  loading: true,
});

export function SiteProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      fetch('/api/settings').then(r => r.json()).catch(() => ({ settings: {} })),
      fetch('/api/categories').then(r => r.json()).catch(() => ({ categories: [] })),
    ]).then(([settingsData, categoriesData]) => {
      if (!mounted) return;
      setSettings(settingsData.settings || {});
      setCategories(categoriesData.categories || []);
      setLoading(false);
    });

    return () => { mounted = false; };
  }, []);

  return (
    <SiteContext.Provider value={{ settings, categories, loading }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  return useContext(SiteContext);
}
