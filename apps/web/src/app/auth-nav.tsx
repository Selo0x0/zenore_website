"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "./cart/cart-context";

export function AuthNav() {
  const { user, loading, signOut } = useAuth();
  const { clearCart } = useCart();
  const router = useRouter();

  if (loading) return null;

  if (user) {
    return (
      <button
        type="button"
        onClick={async () => {
          clearCart();
          await signOut();
          router.push("/");
        }}
        className="text-sm font-medium text-neutral-500 transition hover:text-neutral-950"
      >
        Çıkış Yap
      </button>
    );
  }

  return (
    <Link
      href="/giris"
      className="text-sm font-medium text-neutral-500 transition hover:text-neutral-950"
    >
      Giriş Yap
    </Link>
  );
}
