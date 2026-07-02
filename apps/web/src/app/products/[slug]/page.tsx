import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductImage } from "../../product-image";
import { formatPrice, getImageUrl, getProduct } from "../product-data";
import { AddToCartButton } from "../../cart/add-to-cart-button";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Product not found | Zenore",
    };
  }

  return {
    title: `${product.name} | Zenore`,
    description: product.description ?? undefined,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const primaryImage = product.images[0];

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
        <div className="flex flex-col gap-4">
          <Link href="/" className="text-sm font-medium text-neutral-500 hover:text-neutral-950">
            ← Tüm Ürünler
          </Link>

          <div className="relative aspect-[4/3] overflow-hidden border border-neutral-200 bg-stone-100">
            <ProductImage
              src={getImageUrl(primaryImage)}
              alt={primaryImage?.alt ?? product.name}
            />
          </div>

          {product.images.length > 1 ? (
            <div className="grid grid-cols-4 gap-3">
              {product.images.map((image) => (
                <div
                  key={image.id}
                  className="relative aspect-square overflow-hidden border border-neutral-200 bg-stone-100"
                >
                  <ProductImage
                    src={getImageUrl(image)}
                    alt={image.alt ?? product.name}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-8 border border-neutral-200 bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-4">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-neutral-500">
              Zenore
            </p>
            <div className="flex flex-col gap-4">
              <h1 className="text-4xl font-semibold tracking-tight">
                {product.name}
              </h1>
              <p className="text-2xl font-semibold">
                {formatPrice(product.priceKurus, product.currency)}
              </p>
            </div>
          </div>

          {product.description ? (
            <p className="text-base leading-7 text-neutral-600">
              {product.description}
            </p>
          ) : null}

          <div className="border-t border-neutral-100 pt-6">
            <p className="text-sm text-neutral-500">Stok Durumu</p>
            <p className="mt-1 text-lg font-medium">
              {product.stockQuantity > 0
                ? `${product.stockQuantity} adet stokta`
                : "Stokta yok"}
            </p>
          </div>

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
        </div>
      </section>
    </main>
  );
}
