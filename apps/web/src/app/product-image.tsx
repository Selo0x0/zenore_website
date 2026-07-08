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
      <div className="flex h-full w-full items-center justify-center bg-stone-100 text-sm font-medium text-stone-500">
        Zenore
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
