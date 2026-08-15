"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { CartItem } from "./cart-context";
import { useCart } from "./cart-context";
import { useAuth } from "@/contexts/auth-context";

type AddToCartButtonProps = {
  item: Omit<CartItem, "quantity">;
  disabled?: boolean;
};

export function AddToCartButton({ item, disabled }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [added, setAdded] = useState(false);

  function handleClick() {
    if (!user) {
      router.push(`/giris?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    addItem(item);
    setAdded(true);
  }

  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={handleClick}
      className="h-12 bg-rust px-6 text-sm font-semibold text-cream transition hover:bg-rust-dark disabled:cursor-not-allowed disabled:bg-brown-muted/40"
    >
      {added ? "Sepete Eklendi" : "Sepete Ekle"}
    </button>
  );
}
