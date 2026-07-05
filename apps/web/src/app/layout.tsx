import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CartProvider } from "./cart/cart-context";
import { FavoritesProvider } from "./favoriler/favorites-context";
import { AuthProvider } from "@/contexts/auth-context";
import { ShopShell } from "./shop-shell";
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
            <FavoritesProvider>
              <ShopShell>
                {children}
              </ShopShell>
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
