"use client";

import Link from "next/link";
import { ProductImage } from "./product-image";
import { formatPrice, getImageUrl, isNewProduct, type Product } from "./products/product-data";

export function ProductCard({ product }: { product: Product }) {
  const firstImage = product.images[0];
  const imageUrl = getImageUrl(firstImage);

  return (
    <article className="group flex flex-col">
      <div className="relative overflow-hidden bg-cream-soft">
        <Link href={`/products/${product.slug}`} className="block">
          <div className="relative aspect-[4/3]">
            <ProductImage
              src={imageUrl}
              alt={firstImage?.alt ?? product.name}
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          </div>
        </Link>
        {isNewProduct(product.createdAt) && (
          <span className="absolute left-3 top-3 z-10 rounded-sm bg-cream px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-ink shadow-sm">
            Yeni
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-0.5">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/products/${product.slug}`}
            className="line-clamp-2 text-sm font-medium leading-snug text-ink transition hover:text-rust-dark"
          >
            {product.name}
          </Link>
          <span className="shrink-0 text-sm font-semibold text-ink">
            {formatPrice(product.priceKurus, product.currency)}
          </span>
        </div>
        {product.category && (
          <p className="text-xs text-brown-muted">{product.category.name}</p>
        )}
      </div>
    </article>
  );
}
