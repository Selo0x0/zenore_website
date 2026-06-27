import { ProductImage } from "./product-image";

export const dynamic = "force-dynamic";

type ProductImageMetadata = {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceKurus: number;
  currency: string;
  stockQuantity: number;
  images: ProductImageMetadata[];
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function getProducts(): Promise<Product[]> {
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

function formatPrice(priceKurus: number, currency: string) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
  }).format(priceKurus / 100);
}

function getImageUrl(image?: ProductImageMetadata) {
  if (!image) {
    return undefined;
  }

  return `${apiUrl}${image.url}`;
}

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
                  <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                    <ProductImage
                      src={getImageUrl(firstImage)}
                      alt={firstImage?.alt ?? product.name}
                    />
                  </div>

                  <div className="flex min-h-64 flex-col gap-4 p-5">
                    <div className="flex flex-1 flex-col gap-3">
                      <div className="flex items-start justify-between gap-4">
                        <h2 className="text-lg font-semibold leading-6">
                          {product.name}
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
                      <span className="font-medium text-neutral-950">
                        View details
                      </span>
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
