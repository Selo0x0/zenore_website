import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice, getImageUrl, getProduct, getRelatedProducts, getFeaturedProducts } from "../product-data";
import { AddToCartButton } from "../../cart/add-to-cart-button";
import { FavoriteButton } from "../../favoriler/favorite-button";
import { ProductGallery } from "./product-gallery";
import { ProductCarousel } from "./product-carousel";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) return { title: "Ürün bulunamadı | Zenore" };

  return {
    title: `${product.name} | Zenore`,
    description: product.description ?? undefined,
  };
}

function StockBadge({ quantity }: { quantity: number }) {
  if (quantity === 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-red-500" />
        <span className="text-sm font-medium text-red-600">Stokta Yok</span>
      </div>
    );
  }
  if (quantity <= 5) {
    return (
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-amber-500" />
        <span className="text-sm font-medium text-amber-700">Son {quantity} ürün</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <span className="h-2 w-2 rounded-full bg-emerald-500" />
      <span className="text-sm font-medium text-emerald-700">Stokta Var</span>
    </div>
  );
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [product, relatedProducts, featuredProducts] = await Promise.all([
    getProduct(slug),
    getRelatedProducts(slug),
    getFeaturedProducts(slug),
  ]);

  if (!product) notFound();

  const primaryImage = product.images[0];

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      {/* Product detail */}
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:px-10">
        {/* Gallery column */}
        <div className="flex flex-col gap-3">
          <Link
            href={product.category ? `/kategori/${product.category.slug}` : "/"}
            className="text-sm font-medium text-neutral-400 transition hover:text-neutral-950"
          >
            ← {product.category?.name ?? "Tüm Ürünler"}
          </Link>
          <ProductGallery images={product.images} productName={product.name} />
        </div>

        {/* Info column */}
        <div className="flex flex-col gap-6">
          {/* Brand + name + fav */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
              Zenore
            </p>
            <div className="mt-2 flex items-start justify-between gap-4">
              <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                {product.name}
              </h1>
              <div className="mt-1 shrink-0">
                <FavoriteButton
                  variant="plain"
                  item={{
                    productId: product.id,
                    slug: product.slug,
                    name: product.name,
                    priceKurus: product.priceKurus,
                    currency: product.currency,
                    imageUrl: getImageUrl(primaryImage),
                    imageAlt: primaryImage?.alt ?? product.name,
                  }}
                />
              </div>
            </div>
            <p className="mt-4 text-2xl font-bold">
              {formatPrice(product.priceKurus, product.currency)}
            </p>
          </div>

          {product.description && (
            <p className="text-sm leading-7 text-neutral-600">{product.description}</p>
          )}

          {/* CTA area */}
          <div className="flex flex-col gap-4 border-t border-neutral-100 pt-6">
            <StockBadge quantity={product.stockQuantity} />
            <AddToCartButton
              disabled={product.stockQuantity <= 0}
              item={{
                productId: product.id,
                slug: product.slug,
                name: product.name,
                priceKurus: product.priceKurus,
                currency: product.currency,
                imageUrl: getImageUrl(primaryImage),
                imageAlt: primaryImage?.alt ?? product.name,
              }}
            />
            <p className="text-center text-xs text-neutral-400">
              Türkiye geneli ücretsiz kargo · 1–3 iş günü teslimat
            </p>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 border-t border-neutral-100 pt-5 text-center">
            <div className="flex flex-col items-center gap-1.5">
              <svg
                className="h-5 w-5 text-neutral-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className="text-[11px] leading-4 text-neutral-500">
                Hakiki Deri Garantisi
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <svg
                className="h-5 w-5 text-neutral-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="1" y="3" width="15" height="13" rx="1" />
                <path d="M16 8h4l3 3v5h-7V8z" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
              <span className="text-[11px] leading-4 text-neutral-500">Ücretsiz Kargo</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <svg
                className="h-5 w-5 text-neutral-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span className="text-[11px] leading-4 text-neutral-500">30 Gün İade Hakkı</span>
            </div>
          </div>
        </div>
      </section>

      {/* Carousels */}
      {(relatedProducts.length > 0 || featuredProducts.length > 0) && (
        <section className="border-t border-neutral-200 bg-white">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-5 py-12 sm:px-8 lg:px-10">
            {relatedProducts.length > 0 && (
              <ProductCarousel title="Benzer Ürünler" products={relatedProducts} />
            )}
            {featuredProducts.length > 0 && (
              <ProductCarousel title="Koleksiyondan Seçmeler" products={featuredProducts} />
            )}
          </div>
        </section>
      )}
    </main>
  );
}
