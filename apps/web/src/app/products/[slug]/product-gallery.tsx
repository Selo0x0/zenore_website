"use client";

import { useState } from "react";
import { ProductImage } from "../../product-image";
import type { ProductImageMetadata } from "../product-data";
import { getImageUrl } from "../product-data";

type Props = {
  images: ProductImageMetadata[];
  productName: string;
};

export function ProductGallery({ images, productName }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0];

  function prev() {
    setActiveIndex((i) => (i - 1 + images.length) % images.length);
  }

  function next() {
    setActiveIndex((i) => (i + 1) % images.length);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden border border-neutral-200 bg-stone-100">
        <ProductImage
          src={getImageUrl(activeImage)}
          alt={activeImage?.alt ?? productName}
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Önceki görsel"
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/70 shadow-sm backdrop-blur-sm transition hover:bg-white/90 active:scale-95"
            >
              <svg className="h-4 w-4 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Sonraki görsel"
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/70 shadow-sm backdrop-blur-sm transition hover:bg-white/90 active:scale-95"
            >
              <svg className="h-4 w-4 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`relative aspect-square overflow-hidden border bg-stone-100 transition ${
                i === activeIndex
                  ? "border-neutral-950"
                  : "border-neutral-200 opacity-60 hover:opacity-100"
              }`}
            >
              <ProductImage
                src={getImageUrl(image)}
                alt={image.alt ?? productName}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
