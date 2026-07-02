import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { CartLink } from "./cart/cart-link";
import { CartProvider } from "./cart/cart-context";
import { AuthProvider } from "@/contexts/auth-context";
import { AuthNav } from "./auth-nav";
import { MainNav } from "./nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zenore",
  description: "Günlük kullanım için özenle üretilmiş hakiki deri ürünler.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-neutral-50 text-neutral-950">
        <AuthProvider>
          <CartProvider>
            <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white">
              <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8 lg:px-10">
                <Link
                  href="/"
                  className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-950"
                >
                  Zenore
                </Link>
                <div className="flex items-center gap-6">
                  <AuthNav />
                  <CartLink />
                </div>
              </div>
              <MainNav />
            </header>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
