"use client";

import { useRef } from "react";
import Link from "next/link";
import { ProductImage } from "../../product-image";
import { formatPrice, getImageUrl, type Product } from "../product-data";
import { FavoriteButton } from "../../favoriler/favorite-button";

type Props = {
  title: string;
  products: Product[];
};

export function ProductCarousel({ title, products }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  function scroll(direction: "prev" | "next") {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === "next" ? el.clientWidth * 0.85 : -(el.clientWidth * 0.85), behavior: "smooth" });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scroll("prev")}
            aria-label="Önceki"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scroll("next")}
            aria-label="Sonraki"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => {
          const img = product.images[0];
          return (
            <article
              key={product.id}
              className="w-[calc(50%-8px)] flex-none snap-start overflow-hidden border border-neutral-200 bg-white transition hover:shadow-md sm:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)]"
            >
              <div className="relative">
                <Link href={`/products/${product.slug}`} className="block">
                  <div className="relative aspect-square overflow-hidden bg-stone-100">
                    <ProductImage src={getImageUrl(img)} alt={img?.alt ?? product.name} />
                  </div>
                </Link>
                <div className="absolute right-2 top-2 z-10">
                  <FavoriteButton
                    item={{
                      productId: product.id,
                      slug: product.slug,
                      name: product.name,
                      priceKurus: product.priceKurus,
                      currency: product.currency,
                      imageUrl: getImageUrl(img),
                      imageAlt: img?.alt ?? product.name,
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1 p-3">
                <h3 className="line-clamp-2 text-sm font-semibold leading-5">
                  <Link href={`/products/${product.slug}`} className="hover:text-neutral-600">
                    {product.name}
                  </Link>
                </h3>
                <p className="text-sm font-bold">
                  {formatPrice(product.priceKurus, product.currency)}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
