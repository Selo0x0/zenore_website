"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CartLink } from "./cart/cart-link";
import { FavoritesLink } from "./favoriler/favorites-link";
import { AuthNav } from "./auth-nav";
import { MainNav } from "./nav";
import type { ReactNode } from "react";

export function ShopShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <>
      {!isAdmin && (
        <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8 lg:px-10">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-neutral-950"
            >
              <Image
                src="/zenore-mark.png"
                alt=""
                width={32}
                height={32}
                className="h-8 w-8"
                priority
              />
              Zenore
            </Link>
            <div className="flex items-center gap-4">
              <AuthNav />
              <FavoritesLink />
              <CartLink />
            </div>
          </div>
          <MainNav />
        </header>
      )}
      {children}
    </>
  );
}
