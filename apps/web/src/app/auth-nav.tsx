"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "./cart/cart-context";

export function AuthNav() {
  const { user, loading, signOut } = useAuth();
  const { clearCart } = useCart();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) return null;

  if (!user) {
    return (
      <Link
        href="/giris"
        className="text-sm font-medium text-neutral-500 transition hover:text-neutral-950"
      >
        Giriş Yap
      </Link>
    );
  }

  const displayName = user.displayName ?? user.email ?? "Hesabım";
  const firstName = displayName.split(" ")[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 transition hover:text-neutral-950"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-950 text-xs font-semibold text-white">
          {firstName[0]?.toUpperCase()}
        </span>
        <span className="hidden sm:block">{firstName}</span>
        <svg
          className={`h-3 w-3 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M2 4l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-44 border border-neutral-200 bg-white py-1 shadow-lg">
          <div className="border-b border-neutral-100 px-4 py-2">
            <p className="truncate text-xs text-neutral-400">{user.email}</p>
          </div>
          <Link
            href="/hesabim"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950"
          >
            Hesabım
          </Link>
          <button
            type="button"
            onClick={async () => {
              setOpen(false);
              clearCart();
              await signOut();
              router.push("/");
            }}
            className="block w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950"
          >
            Çıkış Yap
          </button>
        </div>
      )}
    </div>
  );
}
