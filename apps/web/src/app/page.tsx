import Link from "next/link";
import { ProductImage } from "./product-image";
import { formatPrice, getImageUrl, getProducts } from "./products/product-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-10 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-3 border-b border-neutral-200 pb-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-neutral-500">
            Zenore
          </p>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Leather essentials for everyday carry.
              </h1>
              <p className="mt-4 text-base leading-7 text-neutral-600">
                A focused collection of wallets, card holders, and leather
                goods built for clean daily use.
              </p>
            </div>
            <p className="text-sm text-neutral-500">
              {products.length} products available
            </p>
          </div>
        </header>

        {products.length === 0 ? (
          <div className="flex min-h-72 items-center justify-center border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-500">
            No products are available right now.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const firstImage = product.images[0];

              return (
                <article
                  key={product.id}
                  className="overflow-hidden border border-neutral-200 bg-white"
                >
                  <Link
                    href={`/products/${product.slug}`}
                    className="block focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                      <ProductImage
                        src={getImageUrl(firstImage)}
                        alt={firstImage?.alt ?? product.name}
                      />
                    </div>
                  </Link>

                  <div className="flex min-h-64 flex-col gap-4 p-5">
                    <div className="flex flex-1 flex-col gap-3">
                      <div className="flex items-start justify-between gap-4">
                        <h2 className="text-lg font-semibold leading-6">
                          <Link
                            href={`/products/${product.slug}`}
                            className="hover:text-neutral-600"
                          >
                            {product.name}
                          </Link>
                        </h2>
                        <p className="shrink-0 text-base font-semibold">
                          {formatPrice(product.priceKurus, product.currency)}
                        </p>
                      </div>

                      {product.description ? (
                        <p className="line-clamp-3 text-sm leading-6 text-neutral-600">
                          {product.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between border-t border-neutral-100 pt-4 text-sm">
                      <span className="text-neutral-500">
                        {product.stockQuantity} in stock
                      </span>
                      <Link
                        href={`/products/${product.slug}`}
                        className="font-medium text-neutral-950 hover:text-neutral-600"
                      >
                        View details
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
