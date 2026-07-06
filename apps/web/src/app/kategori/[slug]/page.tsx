import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductImage } from "../../product-image";
import {
  formatPrice,
  getCategory,
  getImageUrl,
  getProductsByCategory,
} from "../../products/product-data";
import { FavoriteButton } from "../../favoriler/favorite-button";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "Kategori bulunamadı | Zenore" };
  return {
    title: `${category.name} | Zenore`,
    description: `Zenore ${category.name} koleksiyonu — hakiki deri ürünler.`,
  };
}

export default async function KategoriPage({ params }: Props) {
  const { slug } = await params;
  const [category, products] = await Promise.all([
    getCategory(slug),
    getProductsByCategory(slug),
  ]);

  if (!category) notFound();

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-10 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-3 border-b border-neutral-200 pb-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-neutral-500">
            Zenore
          </p>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              {category.name}
            </h1>
            <p className="text-sm text-neutral-500">
              {products.length} ürün mevcut
            </p>
          </div>
        </header>

        {products.length === 0 ? (
          <div className="flex min-h-72 items-center justify-center border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-500">
            Bu kategoride henüz ürün bulunmamaktadır.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const firstImage = product.images[0];
              return (
                <article
                  key={product.id}
                  className="overflow-hidden border border-neutral-200 bg-white transition hover:shadow-md"
                >
                  <div className="relative">
                    <Link href={`/products/${product.slug}`} className="block">
                      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                        <ProductImage
                          src={getImageUrl(firstImage)}
                          alt={firstImage?.alt ?? product.name}
                        />
                      </div>
                    </Link>
                    <div className="absolute right-3 top-3 z-10">
                      <FavoriteButton
                        item={{
                          productId: product.id,
                          slug: product.slug,
                          name: product.name,
                          priceKurus: product.priceKurus,
                          currency: product.currency,
                          imageUrl: getImageUrl(firstImage),
                          imageAlt: firstImage?.alt ?? product.name,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="text-sm font-semibold leading-5">
                        <Link
                          href={`/products/${product.slug}`}
                          className="hover:text-neutral-600"
                        >
                          {product.name}
                        </Link>
                      </h2>
                      <p className="shrink-0 text-sm font-semibold">
                        {formatPrice(product.priceKurus, product.currency)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-neutral-100 pt-3 text-xs">
                      <span className="text-neutral-400">
                        {product.stockQuantity} stokta
                      </span>
                      <Link
                        href={`/products/${product.slug}`}
                        className="font-medium text-neutral-950 hover:text-neutral-600"
                      >
                        İncele →
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
