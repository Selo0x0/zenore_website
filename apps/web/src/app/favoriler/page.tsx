"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ProductImage } from "@/app/product-image";
import { formatPrice } from "@/app/products/product-data";
import { useFavorites } from "./favorites-context";
import { FavoriteButton } from "./favorite-button";

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
      <main className="min-h-screen bg-neutral-50">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-5 py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-950" />
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-10 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-3 border-b border-neutral-200 pb-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-neutral-500">
            Favoriler
          </p>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Favori Ürünlerim
            </h1>
            {favorites.length > 0 && (
              <p className="text-sm text-neutral-500">{favorites.length} ürün</p>
            )}
          </div>
        </header>

        {favorites.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-5 border border-dashed border-neutral-300 bg-white p-8 text-center">
            <svg
              className="h-12 w-12 text-neutral-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <div>
              <p className="font-semibold text-neutral-700">Henüz favori ürününüz yok</p>
              <p className="mt-1 text-sm text-neutral-400">
                Ürünlerin üzerindeki kalp ikonuna tıklayarak favorilerinize ekleyin.
              </p>
            </div>
            <Link
              href="/"
              className="bg-neutral-950 px-7 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Alışverişe Başla
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((item) => (
              <article
                key={item.productId}
                className="overflow-hidden border border-neutral-200 bg-white transition hover:shadow-md"
              >
                <div className="relative">
                  <Link href={`/products/${item.slug}`} className="block">
                    <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                      <ProductImage src={item.imageUrl} alt={item.imageAlt} />
                    </div>
                  </Link>
                  <div className="absolute right-3 top-3 z-10">
                    <FavoriteButton item={item} />
                  </div>
                </div>

                <div className="flex flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-base font-semibold leading-6">
                      <Link
                        href={`/products/${item.slug}`}
                        className="hover:text-neutral-600"
                      >
                        {item.name}
                      </Link>
                    </h2>
                    <p className="shrink-0 text-base font-semibold">
                      {formatPrice(item.priceKurus, item.currency)}
                    </p>
                  </div>
                  <Link
                    href={`/products/${item.slug}`}
                    className="border border-neutral-200 py-2.5 text-center text-sm font-medium text-neutral-950 transition hover:bg-neutral-950 hover:text-white"
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
