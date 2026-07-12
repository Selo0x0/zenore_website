export type Category = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  children?: Omit<Category, 'children'>[];
};

export type ProductImageMetadata = {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceKurus: number;
  currency: string;
  stockQuantity: number;
  images: ProductImageMetadata[];
  category?: { slug: string; name: string } | null;
};

export const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function getProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${apiUrl}/products`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    return (await response.json()) as Product[];
  } catch {
    return [];
  }
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  try {
    const response = await fetch(
      `${apiUrl}/products?category=${encodeURIComponent(categorySlug)}`,
      { cache: "no-store" },
    );
    if (!response.ok) return [];
    return (await response.json()) as Product[];
  } catch {
    return [];
  }
}

export async function getProduct(slug: string): Promise<Product | null> {
  try {
    const response = await fetch(`${apiUrl}/products/${slug}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as Product;
  } catch {
    return null;
  }
}

export async function getRelatedProducts(slug: string): Promise<Product[]> {
  try {
    const response = await fetch(`${apiUrl}/products/${slug}/related`, {
      cache: "no-store",
    });
    if (!response.ok) return [];
    return (await response.json()) as Product[];
  } catch {
    return [];
  }
}

export async function getFeaturedProducts(slug: string): Promise<Product[]> {
  try {
    const response = await fetch(`${apiUrl}/products/${slug}/featured`, {
      cache: "no-store",
    });
    if (!response.ok) return [];
    return (await response.json()) as Product[];
  } catch {
    return [];
  }
}

export type Review = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  isVerified: boolean;
  createdAt: string;
  customer: { displayName: string | null };
};

export type ProductReviews = {
  reviews: Review[];
  average: number;
  count: number;
};

export async function getProductReviews(slug: string): Promise<ProductReviews> {
  try {
    const response = await fetch(`${apiUrl}/products/${slug}/reviews`, {
      cache: "no-store",
    });
    if (!response.ok) return { reviews: [], average: 0, count: 0 };
    return (await response.json()) as ProductReviews;
  } catch {
    return { reviews: [], average: 0, count: 0 };
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${apiUrl}/categories`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as Category[];
  } catch {
    return [];
  }
}

export async function getCategory(slug: string): Promise<Category | null> {
  try {
    const res = await fetch(`${apiUrl}/categories/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as Category;
  } catch {
    return null;
  }
}

export function formatPrice(priceKurus: number, currency: string) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
  }).format(priceKurus / 100);
}

export function getImageUrl(image?: ProductImageMetadata) {
  if (!image) {
    return undefined;
  }

  return `${apiUrl}/images/products/${image.url}`;
}
