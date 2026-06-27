"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  priceKurus: number;
  currency: string;
  imageUrl?: string;
  imageAlt: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  totalQuantity: number;
  subtotalKurus: number;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
};

const cartStorageKey = "zenore-cart";
const emptyCart: CartItem[] = [];
const cartListeners = new Set<() => void>();
const CartContext = createContext<CartContextValue | null>(null);

let cartSnapshot: CartItem[] = emptyCart;

function readStoredCart() {
  if (typeof window === "undefined") {
    return emptyCart;
  }

  try {
    const value = window.localStorage.getItem(cartStorageKey);

    if (!value) {
      return emptyCart;
    }

    const parsedCart = JSON.parse(value) as CartItem[];

    return Array.isArray(parsedCart) ? parsedCart : emptyCart;
  } catch {
    return emptyCart;
  }
}

function emitCartChange() {
  cartListeners.forEach((listener) => listener());
}

function writeStoredCart(items: CartItem[]) {
  cartSnapshot = items;
  window.localStorage.setItem(cartStorageKey, JSON.stringify(items));
  emitCartChange();
}

function subscribeCart(listener: () => void) {
  cartSnapshot = readStoredCart();
  cartListeners.add(listener);

  const handleStorage = (event: StorageEvent) => {
    if (event.key === cartStorageKey) {
      cartSnapshot = readStoredCart();
      listener();
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    cartListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function getCartSnapshot() {
  return cartSnapshot;
}

function getCartServerSnapshot() {
  return emptyCart;
}

function updateCart(updater: (items: CartItem[]) => CartItem[]) {
  writeStoredCart(updater(cartSnapshot));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(
    subscribeCart,
    getCartSnapshot,
    getCartServerSnapshot,
  );

  const value = useMemo<CartContextValue>(() => {
    const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);
    const subtotalKurus = items.reduce(
      (total, item) => total + item.priceKurus * item.quantity,
      0,
    );

    return {
      items,
      totalQuantity,
      subtotalKurus,
      addItem: (item) => {
        updateCart((currentItems) => {
          const existingItem = currentItems.find(
            (currentItem) => currentItem.productId === item.productId,
          );

          if (!existingItem) {
            return [...currentItems, { ...item, quantity: 1 }];
          }

          return currentItems.map((currentItem) =>
            currentItem.productId === item.productId
              ? { ...currentItem, quantity: currentItem.quantity + 1 }
              : currentItem,
          );
        });
      },
      updateQuantity: (productId, quantity) => {
        updateCart((currentItems) => {
          if (quantity <= 0) {
            return currentItems.filter((item) => item.productId !== productId);
          }

          return currentItems.map((item) =>
            item.productId === productId ? { ...item, quantity } : item,
          );
        });
      },
      removeItem: (productId) => {
        updateCart((currentItems) =>
          currentItems.filter((item) => item.productId !== productId),
        );
      },
      clearCart: () => {
        writeStoredCart([]);
      },
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider.");
  }

  return context;
}
