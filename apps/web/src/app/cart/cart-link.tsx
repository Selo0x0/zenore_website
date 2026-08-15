"use client";

import Link from "next/link";
import { useCart } from "./cart-context";

export function CartLink() {
  const { totalQuantity } = useCart();

  return (
    <Link
      href="/cart"
      className="relative flex h-9 w-9 items-center justify-center text-ink transition hover:text-rust-dark"
      aria-label={`Sepet${totalQuantity > 0 ? ` (${totalQuantity} ürün)` : ""}`}
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
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>

      {totalQuantity > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rust text-[10px] font-semibold text-cream">
          {totalQuantity > 9 ? "9+" : totalQuantity}
        </span>
      )}
    </Link>
  );
}
