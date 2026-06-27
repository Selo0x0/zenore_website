"use client";

import Link from "next/link";
import { useCart } from "./cart-context";

export function CartLink() {
  const { totalQuantity } = useCart();

  return (
    <Link
      href="/cart"
      className="text-sm font-medium text-neutral-950 hover:text-neutral-600"
    >
      Cart ({totalQuantity})
    </Link>
  );
}
