"use client";

import Link from "next/link";
import { FavoriteButton } from "./favoriler/favorite-button";
import { ProductImage } from "./product-image";
import { formatPrice, getImageUrl, type Product } from "./products/product-data";

export function ProductCard({ product }: { product: Product }) {
  const firstImage = product.images[0];
  const imageUrl = getImageUrl(firstImage);

  return (
    <article className="group flex flex-col">
      <div className="relative overflow-hidden bg-stone-100">
        <Link href={`/products/${product.slug}`} className="block">
          <div className="relative aspect-[4/3]">
            <ProductImage
              src={imageUrl}
              alt={firstImage?.alt ?? product.name}
              className="object-cover transition duration-500 group-hover:scale-105"
            />
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
              imageUrl,
              imageAlt: firstImage?.alt ?? product.name,
            }}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-0.5">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/products/${product.slug}`}
            className="line-clamp-2 text-sm font-medium leading-snug text-neutral-950 transition hover:text-neutral-600"
          >
            {product.name}
          </Link>
          <span className="shrink-0 text-sm font-semibold text-neutral-950">
            {formatPrice(product.priceKurus, product.currency)}
          </span>
        </div>
        {product.category && (
          <p className="text-xs text-neutral-400">{product.category.name}</p>
        )}
      </div>
    </article>
  );
}
