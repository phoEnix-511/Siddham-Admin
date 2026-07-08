export interface ProductSearchItem {
  id: string;
  name: string;
  price?: number;
  images?: string[];
  description?: string;
  caption?: string;
  category?: {
    name: string;
    slug: string;
  };
}

interface ProductSearchCachePayload {
  savedAt: number;
  products: ProductSearchItem[];
}

const CACHE_KEY = 'siddham:product-search-products:v1';
const CACHE_TTL_MS = 10 * 60 * 1000;
const PAGE_SIZE = 250;

let memoryCache: ProductSearchCachePayload | null = null;
let inFlightProducts: Promise<ProductSearchItem[]> | null = null;

function isProductSearchItem(product: ProductSearchItem | null): product is ProductSearchItem {
  return product !== null;
}

function normalizeProduct(product: Record<string, unknown>): ProductSearchItem | null {
  if (typeof product.id !== 'string' || typeof product.name !== 'string') {
    return null;
  }

  const category =
    product.category &&
    typeof product.category === 'object' &&
    'name' in product.category &&
    'slug' in product.category
      ? product.category
      : null;

  return {
    id: product.id,
    name: product.name,
    price: typeof product.price === 'number' ? product.price : undefined,
    images: Array.isArray(product.images)
      ? product.images.filter((image): image is string => typeof image === 'string')
      : [],
    description: typeof product.description === 'string' ? product.description : undefined,
    caption: typeof product.caption === 'string' ? product.caption : undefined,
    category:
      category &&
      typeof category.name === 'string' &&
      typeof category.slug === 'string'
        ? {
            name: category.name,
            slug: category.slug,
          }
        : undefined,
  };
}

function isFresh(payload: ProductSearchCachePayload) {
  return Date.now() - payload.savedAt < CACHE_TTL_MS;
}

function readStoredPayload(): ProductSearchCachePayload | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<ProductSearchCachePayload>;
    if (typeof parsed.savedAt !== 'number' || !Array.isArray(parsed.products)) {
      return null;
    }

    return {
      savedAt: parsed.savedAt,
      products: parsed.products.map((product) => normalizeProduct(product as unknown as Record<string, unknown>)).filter(isProductSearchItem),
    };
  } catch {
    return null;
  }
}

function writePayload(products: ProductSearchItem[]) {
  const payload = { savedAt: Date.now(), products };
  memoryCache = payload;

  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Search should keep working even if storage is full or disabled.
  }
}

async function fetchProductSearchPage(page: number) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
    sort: 'name_asc',
  });

  const res = await fetch(`/api/products?${params.toString()}`);
  if (!res.ok) {
    throw new Error('Failed to fetch product suggestions');
  }

  const data = await res.json();
  const products = Array.isArray(data.products)
    ? data.products.map((product: Record<string, unknown>) => normalizeProduct(product)).filter(isProductSearchItem)
    : [];
  const pages = Number(data.pagination?.pages || 1);

  return {
    products,
    pages: Number.isFinite(pages) && pages > 0 ? pages : 1,
  };
}

async function fetchAllProductSearchProducts() {
  const firstPage = await fetchProductSearchPage(1);
  if (firstPage.pages <= 1) {
    return firstPage.products;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.pages - 1 }, (_, index) => fetchProductSearchPage(index + 2)),
  );

  return [
    ...firstPage.products,
    ...remainingPages.flatMap((page) => page.products),
  ];
}

export async function getProductSearchProducts() {
  if (memoryCache && isFresh(memoryCache)) {
    return memoryCache.products;
  }

  const storedPayload = readStoredPayload();
  if (storedPayload && isFresh(storedPayload)) {
    memoryCache = storedPayload;
    return storedPayload.products;
  }

  if (inFlightProducts) {
    return inFlightProducts;
  }

  const request = fetchAllProductSearchProducts()
    .then((products) => {
      writePayload(products);
      return products;
    })
    .catch((error) => {
      if (storedPayload?.products.length) {
        return storedPayload.products;
      }

      throw error;
    });

  inFlightProducts = request;

  try {
    return await request;
  } finally {
    if (inFlightProducts === request) {
      inFlightProducts = null;
    }
  }
}

export function filterProductSearchProducts(products: ProductSearchItem[], query: string, limit = 6) {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.length < 2) {
    return [];
  }

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

  return products
    .map((product) => {
      const name = product.name.toLowerCase();
      const category = `${product.category?.name || ''} ${product.category?.slug || ''}`.toLowerCase();
      const searchText = `${name} ${category} ${product.description || ''} ${product.caption || ''}`.toLowerCase();

      if (!tokens.every((token) => searchText.includes(token))) {
        return null;
      }

      let score = 30;
      if (name === normalizedQuery) score = 0;
      else if (name.startsWith(normalizedQuery)) score = 5;
      else if (name.includes(normalizedQuery)) score = 10;
      else if (category.includes(normalizedQuery)) score = 20;

      return { product, score };
    })
    .filter((result): result is { product: ProductSearchItem; score: number } => result !== null)
    .sort((a, b) => a.score - b.score || a.product.name.localeCompare(b.product.name))
    .slice(0, limit)
    .map(({ product }) => product);
}
