"use client";

import Image from "next/image";
import { useState } from "react";

type ProductImageProps = {
  src?: string;
  alt: string;
  className?: string;
  sizes?: string;
};

export function ProductImage({ src, alt, className = "object-cover", sizes }: ProductImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-stone-100">
        <svg
          className="h-6 w-6 text-stone-300"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <circle cx="7.5" cy="7.5" r="1.25" fill="currentColor" stroke="none" />
        </svg>
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">
          Zenore
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes ?? "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"}
      className={className}
      onError={() => setHasError(true)}
      unoptimized
    />
  );
}
