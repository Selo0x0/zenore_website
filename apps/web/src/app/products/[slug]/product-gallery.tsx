"use client";

import { useEffect, useState } from "react";
import { ProductImage } from "../../product-image";
import type { ProductImageMetadata } from "../product-data";
import { getImageUrl } from "../product-data";
import { ProductLightbox } from "./product-lightbox";

type Props = {
  images: ProductImageMetadata[];
  productName: string;
};

export function ProductGallery({ images, productName }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const activeImage = images[activeIndex] ?? images[0];

  function prev() {
    setActiveIndex((i) => (i - 1 + images.length) % images.length);
    setZoomed(false);
  }

  function next() {
    setActiveIndex((i) => (i + 1) % images.length);
    setZoomed(false);
  }

  useEffect(() => {
    if (!lightboxOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen]);

  return (
    <div className="flex flex-col gap-3">
      <div className="group relative aspect-square overflow-hidden bg-cream-soft">
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label="Görseli büyüt"
          className="absolute inset-0 z-0 cursor-zoom-in"
        >
          <ProductImage
            src={getImageUrl(activeImage)}
            alt={activeImage?.alt ?? productName}
            className="object-contain"
          />
        </button>
        <div className="pointer-events-none absolute bottom-2 right-2 z-[1] flex h-8 w-8 items-center justify-center rounded-full bg-cream/80 text-ink shadow-sm backdrop-blur-sm">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </div>
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Önceki görsel"
              className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-cream/40 bg-cream/70 shadow-sm backdrop-blur-sm transition hover:bg-cream/90 active:scale-95"
            >
              <svg className="h-4 w-4 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Sonraki görsel"
              className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-cream/40 bg-cream/70 shadow-sm backdrop-blur-sm transition hover:bg-cream/90 active:scale-95"
            >
              <svg className="h-4 w-4 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              className={`relative aspect-square overflow-hidden border bg-cream-soft transition ${
                i === activeIndex
                  ? "border-rust-dark"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <ProductImage
                src={getImageUrl(image)}
                alt={image.alt ?? productName}
                className="object-contain"
              />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <ProductLightbox
          images={images}
          activeIndex={activeIndex}
          productName={productName}
          zoomed={zoomed}
          onToggleZoom={() => setZoomed((z) => !z)}
          onClose={() => setLightboxOpen(false)}
          onPrev={prev}
          onNext={next}
        />
      )}
    </div>
  );
}
