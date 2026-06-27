"use client";

import { useState } from "react";
import type { CartItem } from "./cart-context";
import { useCart } from "./cart-context";

type AddToCartButtonProps = {
  item: Omit<CartItem, "quantity">;
  disabled?: boolean;
};

export function AddToCartButton({ item, disabled }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        addItem(item);
        setAdded(true);
      }}
      className="h-12 bg-neutral-950 px-6 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
    >
      {added ? "Added to cart" : "Add to cart"}
    </button>
  );
}
