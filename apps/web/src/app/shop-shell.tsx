"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CartLink } from "./cart/cart-link";
import { HeaderSearch } from "./header-search";
import { AuthNav } from "./auth-nav";
import { MainNav } from "./nav";
import { SiteFooter } from "./site-footer";
import type { ReactNode } from "react";

export function ShopShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <div className={isAdmin ? undefined : "storefront"}>
      {!isAdmin && (
        <header className="sticky top-0 z-50 border-b border-brown-muted/15 bg-cream">
          <div className="relative mx-auto flex h-20 w-full max-w-6xl items-center justify-between gap-6 px-5 sm:px-8 lg:px-10">
            <Link
              href="/"
              className="flex shrink-0 flex-col items-center gap-1 text-sm font-semibold uppercase tracking-[0.18em] text-ink"
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
            <div className="flex flex-1 items-center justify-between">
              <MainNav />
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <HeaderSearch />
              <AuthNav />
              <CartLink />
            </div>
          </div>
        </header>
      )}
      {children}
      {!isAdmin && <SiteFooter />}
    </div>
  );
}
