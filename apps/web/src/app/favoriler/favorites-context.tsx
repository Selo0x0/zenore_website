"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiUrl, apiFetch } from "@/lib/api";

export type FavoriteItem = {
  productId: string;
  slug: string;
  name: string;
  priceKurus: number;
  currency: string;
  imageUrl?: string;
  imageAlt: string;
};

type ApiFavorite = {
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    priceKurus: number;
    currency: string;
    images: { url: string; alt: string | null }[];
  };
};

type FavoritesContextValue = {
  favorites: FavoriteItem[];
  count: number;
  loading: boolean;
  isFavorited: (productId: string) => boolean;
  toggleFavorite: (item: FavoriteItem) => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    user
      .getIdToken()
      .then((token) => apiFetch<ApiFavorite[]>("/customers/me/favorites", token))
      .then((data) => {
        if (!cancelled) {
          setFavorites(
            data.map((f) => ({
              productId: f.productId,
              slug: f.product.slug,
              name: f.product.name,
              priceKurus: f.product.priceKurus,
              currency: f.product.currency,
              imageUrl: f.product.images[0]
                ? `${apiUrl}/images/products/${f.product.images[0].url}`
                : undefined,
              imageAlt: f.product.images[0]?.alt ?? f.product.name,
            })),
          );
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  async function toggleFavorite(item: FavoriteItem) {
    if (!user) return;

    const wasFavorited = favorites.some((f) => f.productId === item.productId);

    setFavorites((prev) =>
      wasFavorited
        ? prev.filter((f) => f.productId !== item.productId)
        : [...prev, item],
    );

    try {
      const token = await user.getIdToken();
      if (wasFavorited) {
        await apiFetch(`/customers/me/favorites/${item.productId}`, token, {
          method: "DELETE",
        });
      } else {
        await apiFetch("/customers/me/favorites", token, {
          method: "POST",
          body: JSON.stringify({ productId: item.productId }),
        });
      }
    } catch {
      setFavorites((prev) =>
        wasFavorited
          ? [...prev, item]
          : prev.filter((f) => f.productId !== item.productId),
      );
    }
  }

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        count: favorites.length,
        loading,
        isFavorited: (productId) => favorites.some((f) => f.productId === productId),
        toggleFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used inside FavoritesProvider.");
  return ctx;
}
