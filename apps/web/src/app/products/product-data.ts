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
