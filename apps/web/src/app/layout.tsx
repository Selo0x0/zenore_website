import type { Metadata } from "next";
import { Geist, Geist_Mono, PT_Serif } from "next/font/google";
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

// Turkish characters (ğ, ş, ı, ç, ö, ü) require latin-ext, not just latin.
const ptSerif = PT_Serif({
  variable: "--font-pt-serif",
  weight: ["400", "700"],
  subsets: ["latin", "latin-ext"],
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
      className={`${geistSans.variable} ${geistMono.variable} ${ptSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-cream text-ink">
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
