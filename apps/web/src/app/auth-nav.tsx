"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "./cart/cart-context";

export function AuthNav() {
  const { user, loading, signOut, isAdmin } = useAuth();
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
        aria-label="Giriş Yap"
        className="flex h-9 w-9 items-center justify-center text-ink transition hover:text-rust-dark"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21a8 8 0 0 0-16 0" />
          <circle cx="12" cy="7" r="4" />
        </svg>
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
        className="flex items-center gap-1.5 text-sm font-medium text-brown transition hover:text-ink"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rust text-xs font-semibold text-cream">
          {firstName[0]?.toUpperCase()}
        </span>
        <span className="hidden sm:block">{firstName}</span>
        <svg
          className={`h-3 w-3 text-brown-muted transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M2 4l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 border border-brown-muted/15 bg-cream-soft py-1 shadow-lg">
          <div className="border-b border-brown-muted/15 px-4 py-2">
            <p className="truncate text-xs text-brown-muted">{user.email}</p>
          </div>
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 border-b border-brown-muted/15 px-4 py-2 text-sm font-medium text-ink hover:bg-cream"
            >
              <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
              Admin Paneli
            </Link>
          )}
          <Link
            href="/hesabim"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-brown hover:bg-cream hover:text-ink"
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
            className="block w-full px-4 py-2 text-left text-sm text-brown hover:bg-cream hover:text-ink"
          >
            Çıkış Yap
          </button>
        </div>
      )}
    </div>
  );
}
