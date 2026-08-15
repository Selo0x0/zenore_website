"use client";

import type { ProductImageMetadata } from "../product-data";
import { getImageUrl } from "../product-data";

type Props = {
  images: ProductImageMetadata[];
  activeIndex: number;
  productName: string;
  zoomed: boolean;
  onToggleZoom: () => void;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};

export function ProductLightbox({
  images,
  activeIndex,
  productName,
  zoomed,
  onToggleZoom,
  onClose,
  onPrev,
  onNext,
}: Props) {
  const image = images[activeIndex];

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex flex-col bg-ink/95">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <span className="text-sm text-cream/70">
          {activeIndex + 1} / {images.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Kapat"
          className="flex h-9 w-9 items-center justify-center rounded-full text-cream transition hover:bg-cream/10"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div
          className={`flex h-full w-full items-center justify-center ${zoomed ? "cursor-zoom-out overflow-auto" : "cursor-zoom-in overflow-hidden"}`}
          onClick={onToggleZoom}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getImageUrl(image)}
            alt={image?.alt ?? productName}
            className={zoomed ? "max-w-none object-contain" : "h-full w-full object-contain"}
            style={zoomed ? { width: "200%" } : undefined}
          />
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={onPrev}
              aria-label="Önceki görsel"
              className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-cream/10 text-cream transition hover:bg-cream/20 sm:left-4"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onNext}
              aria-label="Sonraki görsel"
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-cream/10 text-cream transition hover:bg-cream/20 sm:right-4"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
