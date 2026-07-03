"use client";

import Link from "next/link";

export function FavoritesLink() {
  return (
    <Link
      href="/favoriler"
      className="flex h-9 w-9 items-center justify-center text-neutral-950 transition hover:text-neutral-600"
      aria-label="Favoriler"
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </Link>
  );
}
