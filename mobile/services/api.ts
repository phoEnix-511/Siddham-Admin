import { API_BASE_URL } from '../constants/config';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}/api${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  comparePrice?: number;
  images: string[];
  stock: number;
  sku?: string;
  weight?: string;
  ingredients?: string;
  benefits?: string;
  usage?: string;
  isFeatured: boolean;
  isActive: boolean;
  category: { id: string; name: string; slug: string };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  _count: { products: number };
}

export const api = {
  products: {
    list: (params?: { featured?: boolean; category?: string; search?: string; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.featured) q.set('featured', 'true');
      if (params?.category) q.set('category', params.category);
      if (params?.search) q.set('search', params.search);
      if (params?.limit) q.set('limit', String(params.limit));
      return request<{ products: Product[] }>(`/products?${q.toString()}`);
    },
    get: (id: string) => request<{ product: Product }>(`/products/${id}`),
  },

  categories: {
    list: () => request<{ categories: Category[] }>('/categories'),
  },

  orders: {
    create: (data: {
      customer: { name: string; email: string; phone?: string };
      shippingAddress: { address: string; city: string; state: string; pincode: string };
      items: Array<{ productId: string; quantity: number; price: number }>;
      totalAmount: number;
      shippingAmount: number;
    }) => request<{ order: { id: string; orderNumber: string } }>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  payment: {
    createOrder: (data: { amount: number; orderId: string }) =>
      request<{ razorpayOrderId: string; amount: number; currency: string; keyId: string }>(
        '/payment/create-order',
        { method: 'POST', body: JSON.stringify(data) }
      ),
    verify: (data: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
      orderId: string;
    }) => request<{ success: boolean }>('/payment/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },
};
