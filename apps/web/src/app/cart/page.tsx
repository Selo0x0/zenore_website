"use client";

import Link from "next/link";
import { ProductImage } from "../product-image";
import { formatPrice } from "../products/product-data";
import { useCart } from "./cart-context";

export default function CartPage() {
  const { items, subtotalKurus, updateQuantity, removeItem, clearCart } = useCart();
  const currency = items[0]?.currency ?? "TRY";

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-10 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-3 border-b border-neutral-200 pb-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-neutral-500">
            Zenore
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">Sepetim</h1>
        </header>

        {items.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-4 border border-dashed border-neutral-300 bg-white p-8 text-center">
            <p className="text-neutral-500">Sepetiniz boş.</p>
            <Link href="/" className="font-medium text-neutral-950 hover:text-neutral-600">
              Alışverişe Başla
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <article
                  key={item.productId}
                  className="grid gap-4 border border-neutral-200 bg-white p-4 sm:grid-cols-[140px_1fr]"
                >
                  <Link
                    href={`/products/${item.slug}`}
                    className="relative aspect-square overflow-hidden bg-stone-100"
                  >
                    <ProductImage src={item.imageUrl} alt={item.imageAlt} />
                  </Link>

                  <div className="flex flex-col justify-between gap-4">
                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/products/${item.slug}`}
                        className="text-lg font-semibold hover:text-neutral-600"
                      >
                        {item.name}
                      </Link>
                      <p className="text-sm text-neutral-500">
                        {formatPrice(item.priceKurus, item.currency)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center border border-neutral-200">
                        <button
                          type="button"
                          className="h-10 w-10 text-lg transition hover:bg-neutral-50"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span className="flex h-10 min-w-10 items-center justify-center px-3 text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="h-10 w-10 text-lg transition hover:bg-neutral-50"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className="text-sm font-medium text-neutral-400 transition hover:text-red-500"
                        onClick={() => removeItem(item.productId)}
                      >
                        Kaldır
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <aside className="flex h-fit flex-col gap-5 border border-neutral-200 bg-white p-5">
              <h2 className="text-lg font-semibold">Sipariş Özeti</h2>

              <div className="flex flex-col gap-2 border-t border-neutral-100 pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Ara Toplam</span>
                  <span className="font-medium">{formatPrice(subtotalKurus, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Kargo</span>
                  <span className="font-medium text-green-600">Ücretsiz</span>
                </div>
              </div>

              <div className="flex justify-between border-t border-neutral-200 pt-4">
                <span className="font-semibold">Toplam</span>
                <span className="text-lg font-semibold">
                  {formatPrice(subtotalKurus, currency)}
                </span>
              </div>

              <Link
                href="/odeme"
                className="flex h-12 items-center justify-center bg-neutral-950 px-6 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                Siparişi Tamamla
              </Link>

              <button
                type="button"
                className="text-sm font-medium text-neutral-400 transition hover:text-neutral-950"
                onClick={clearCart}
              >
                Sepeti Temizle
              </button>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
