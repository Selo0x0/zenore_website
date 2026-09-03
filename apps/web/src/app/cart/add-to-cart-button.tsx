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

  function handleClick() {
    addItem(item);
    setAdded(true);
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className="h-12 bg-rust px-6 text-sm font-semibold text-cream transition hover:bg-rust-dark disabled:cursor-not-allowed disabled:bg-brown-muted/40"
    >
      {added ? "Sepete Eklendi" : "Sepete Ekle"}
    </button>
  );
}
