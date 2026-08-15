"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Toast } from "@/app/toast";
import { useFavorites, type FavoriteItem } from "./favorites-context";

type Props = {
  item: FavoriteItem;
  variant?: "overlay" | "plain";
};

export function FavoriteButton({ item, variant = "overlay" }: Props) {
  const { user } = useAuth();
  const { isFavorited, toggleFavorite } = useFavorites();
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const favorited = isFavorited(item.productId);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      setToastMsg("Favorilere eklemek için giriş yapınız.");
      setTimeout(() => setToastMsg(null), 4000);
      return;
    }

    await toggleFavorite(item);
  }

  const buttonClass =
    variant === "plain"
      ? "flex h-9 w-9 items-center justify-center rounded-full transition hover:scale-110 active:scale-95"
      : "flex h-8 w-8 items-center justify-center rounded-full border border-cream/40 bg-cream/70 shadow-sm backdrop-blur-sm transition hover:bg-cream/90 hover:scale-110 active:scale-95";

  const iconClass =
    variant === "plain"
      ? `h-5 w-5 transition-colors ${favorited ? "fill-red-500 text-red-500" : "fill-none text-brown-muted hover:text-brown"}`
      : `h-4 w-4 transition-colors ${favorited ? "fill-red-500 text-red-500" : "fill-none text-brown-muted"}`;

  return (
    <>
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      <button
        type="button"
        onClick={handleClick}
        aria-label={favorited ? "Favorilerden çıkar" : "Favorilere ekle"}
        className={buttonClass}
      >
        <svg
          className={iconClass}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
    </>
  );
}
