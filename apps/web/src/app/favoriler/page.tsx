"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ProductImage } from "@/app/product-image";
import { formatPrice } from "@/app/products/product-data";
import { useFavorites } from "./favorites-context";
import { FavoriteButton } from "./favorite-button";
import { EmptyState, emptyStateIcons } from "@/app/empty-state";

export default function FavorilerPage() {
  const { user, loading: authLoading } = useAuth();
  const { favorites, loading: favLoading } = useFavorites();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/giris?redirect=/favoriler");
    }
  }, [user, authLoading, router]);

  if (authLoading || (user && favLoading)) {
    return (
      <main className="min-h-screen bg-cream">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-5 py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brown-muted/20 border-t-rust" />
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-cream text-ink">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-10 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-3 border-b border-brown-muted/15 pb-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-brown-muted">
            Favoriler
          </p>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <h1 className="font-serif text-4xl tracking-tight text-ink sm:text-5xl">
              Favori Ürünlerim
            </h1>
            {favorites.length > 0 && (
              <p className="text-sm text-brown-muted">{favorites.length} ürün</p>
            )}
          </div>
        </header>

        {favorites.length === 0 ? (
          <EmptyState
            icon={emptyStateIcons.heart}
            title="Henüz favori ürününüz yok"
            description="Ürünlerin üzerindeki kalp ikonuna tıklayarak favorilerinize ekleyin."
            actionLabel="Alışverişe Başla"
            actionHref="/"
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((item) => (
              <article
                key={item.productId}
                className="overflow-hidden border border-brown-muted/15 bg-cream-soft transition hover:shadow-md"
              >
                <div className="relative">
                  <Link href={`/products/${item.slug}`} className="block">
                    <div className="relative aspect-[4/3] overflow-hidden bg-cream">
                      <ProductImage src={item.imageUrl} alt={item.imageAlt} />
                    </div>
                  </Link>
                  <div className="absolute right-3 top-3 z-10">
                    <FavoriteButton item={item} />
                  </div>
                </div>

                <div className="flex flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-base font-semibold leading-6 text-ink">
                      <Link
                        href={`/products/${item.slug}`}
                        className="hover:text-rust-dark"
                      >
                        {item.name}
                      </Link>
                    </h2>
                    <p className="shrink-0 text-base font-semibold text-ink">
                      {formatPrice(item.priceKurus, item.currency)}
                    </p>
                  </div>
                  <Link
                    href={`/products/${item.slug}`}
                    className="border border-brown-muted/20 py-2.5 text-center text-sm font-medium text-ink transition hover:bg-rust hover:border-rust hover:text-cream"
                  >
                    Ürünü İncele
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
