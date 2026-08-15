"use client";

import Link from "next/link";
import { ProductImage } from "../product-image";
import { formatPrice } from "../products/product-data";
import { useCart } from "./cart-context";
import { EmptyState, emptyStateIcons } from "../empty-state";

export default function CartPage() {
  const { items, subtotalKurus, updateQuantity, removeItem, clearCart } = useCart();
  const currency = items[0]?.currency ?? "TRY";

  return (
    <main className="min-h-screen bg-cream text-ink">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-10 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-3 border-b border-brown-muted/15 pb-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-brown-muted">
            Zenore
          </p>
          <h1 className="font-serif text-4xl tracking-tight text-ink">Sepetim</h1>
        </header>

        {items.length === 0 ? (
          <EmptyState
            icon={emptyStateIcons.bag}
            title="Sepetiniz boş"
            description="Beğendiğiniz ürünleri sepete ekleyerek alışverişe başlayın."
            actionLabel="Alışverişe Başla"
            actionHref="/"
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <article
                  key={item.productId}
                  className="grid grid-cols-[96px_1fr] gap-4 border border-brown-muted/15 bg-cream-soft p-4 sm:grid-cols-[140px_1fr]"
                >
                  <Link
                    href={`/products/${item.slug}`}
                    className="relative aspect-square overflow-hidden bg-cream"
                  >
                    <ProductImage src={item.imageUrl} alt={item.imageAlt} />
                  </Link>

                  <div className="flex min-w-0 flex-col justify-between gap-3 sm:gap-4">
                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/products/${item.slug}`}
                        className="text-sm font-semibold leading-snug text-ink hover:text-rust-dark sm:text-lg"
                      >
                        {item.name}
                      </Link>
                      <p className="text-sm text-brown-muted">
                        {formatPrice(item.priceKurus, item.currency)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                      <div className="flex items-center border border-brown-muted/20">
                        <button
                          type="button"
                          className="h-9 w-9 text-lg text-ink transition hover:bg-cream sm:h-10 sm:w-10"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span className="flex h-9 min-w-9 items-center justify-center px-2 text-sm font-medium text-ink sm:h-10 sm:min-w-10 sm:px-3">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="h-9 w-9 text-lg text-ink transition hover:bg-cream sm:h-10 sm:w-10"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className="text-sm font-medium text-brown-muted transition hover:text-red-500"
                        onClick={() => removeItem(item.productId)}
                      >
                        Kaldır
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <aside className="flex h-fit flex-col gap-5 border border-brown-muted/15 bg-cream-soft p-5">
              <h2 className="font-serif text-lg text-ink">Sipariş Özeti</h2>

              <div className="flex flex-col gap-2 border-t border-brown-muted/15 pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-brown-muted">Ara Toplam</span>
                  <span className="font-medium text-ink">{formatPrice(subtotalKurus, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brown-muted">Kargo</span>
                  <span className="font-medium text-green-600">Ücretsiz</span>
                </div>
              </div>

              <div className="flex justify-between border-t border-brown-muted/15 pt-4">
                <span className="font-semibold text-ink">Toplam</span>
                <span className="text-lg font-semibold text-ink">
                  {formatPrice(subtotalKurus, currency)}
                </span>
              </div>

              <Link
                href="/odeme"
                className="flex h-12 items-center justify-center bg-rust px-6 text-sm font-semibold text-cream transition hover:bg-rust-dark"
              >
                Siparişi Tamamla
              </Link>

              <button
                type="button"
                className="text-sm font-medium text-brown-muted transition hover:text-ink"
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
