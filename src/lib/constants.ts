// Shared constants used across the Siddham Wellness storefront

export const CATEGORY_ICONS: Record<string, string> = {
  'hair-care': '💆',
  'supplements': '💊',
  'skin-care': '✨',
  'oils-essentials': '🌿',
  'ayurvedic-herbal-formulation': '🍶',
  'ayurvedic-proprietary-medicine': '💊',
  'ayurvedic-formulation': '🍯',
};

export interface Product {
  id: string;
  name: string;
  caption?: string;
  price: number;
  comparePrice?: number;
  images: string[];
  stock: number;
  isFeatured: boolean;
  category: { name: string; slug: string };
  description: string;
  variants?: Array<{
    id: string;
    name: string;
    price: number;
    stock: number;
  }>;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  _count: { products: number };
}
