"use client";

import { useEffect, useRef, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { ProductImage } from "@/app/product-image";
import { apiFetch, apiUrl } from "@/lib/api";
import { formatPrice } from "@/app/products/product-data";
import { getGuestOrderAccessHeaders } from "@/lib/order-access";

type OrderItem = {
  id: string;
  productName: string;
  productSlug: string;
  unitPriceKurus: number;
  quantity: number;
  lineTotalKurus: number;
  productImageUrl: string | null;
  productImageAlt: string | null;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  currency: string;
  subtotalKurus: number;
  shippingKurus: number;
  discountCode: string | null;
  discountKurus: number;
  totalKurus: number;
  createdAt: string;
  items: OrderItem[];
};

export default function SiparisOnayPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = use(params);
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const pollAttemptsRef = useRef(0);

  const fetchOrder = async () => {
    const firebaseToken = user ? await user.getIdToken() : undefined;
    const data = await apiFetch<Order>(
      `/orders/${orderNumber}`,
      firebaseToken,
      { headers: getGuestOrderAccessHeaders(orderNumber) },
    );
    setOrder(data);
    return data;
  };

  useEffect(() => {
    // Arriving here via router.push from a scrolled checkout page can leave
    // the browser's scroll position clamped to this (shorter) page's max
    // scroll instead of resetting to 0, hiding the header above the fold.
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    (async () => {
      try {
        await fetchOrder();
      } catch {
        // order not found
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber, authLoading]);

  useEffect(() => {
    if (order?.paymentStatus !== "PENDING") return;

    const timer = setInterval(() => {
      pollAttemptsRef.current += 1;
      if (pollAttemptsRef.current > 40) {
        clearInterval(timer);
        setPollTimedOut(true);
        return;
      }

      void (async () => {
        try {
          await fetchOrder();
        } catch {
          // transient read issue; keep polling until timeout
        }
      })();
    }, 3000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.paymentStatus, orderNumber]);

  if (loading || authLoading) {
    return (
      <main className="min-h-screen bg-cream">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-5 py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brown-muted/20 border-t-rust" />
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-cream text-ink">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 py-32 text-center">
          <p className="text-lg font-semibold">Sipariş bulunamadı.</p>
          <Link href="/" className="text-sm text-brown-muted hover:text-ink">
            Ana Sayfaya Dön
          </Link>
        </div>
      </main>
    );
  }

  if (order.paymentStatus === "PENDING") {
    return (
      <main className="min-h-screen bg-cream text-ink">
        <div className="mx-auto flex max-w-2xl flex-col items-center px-5 py-24 text-center sm:px-8">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-cream-soft">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-brown-muted/20 border-t-rust" />
          </div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-brown-muted">
            Ödeme Kontrol Ediliyor
          </p>
          <h1 className="mt-2 font-serif text-2xl text-ink">
            Siparişinizin ödeme onayı bekleniyor
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-brown-muted">
            PayTR ödeme sonucunu bize iletiyor. Bu genelde birkaç saniye sürer;
            lütfen bu sayfayı kapatmayın.
          </p>
          <div className="mt-6 rounded border border-brown-muted/15 bg-cream-soft px-5 py-3">
            <p className="text-xs font-medium uppercase tracking-wider text-brown-muted">
              Sipariş Numarası
            </p>
            <p className="mt-1 font-mono text-lg font-semibold text-ink">
              {order.orderNumber}
            </p>
          </div>
          {pollTimedOut && (
            <div className="mt-6 border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
              Onay beklenenden uzun sürdü. Ödeme yaptıysanız siparişiniz kısa
              süre içinde güncellenir.
              <button
                type="button"
                onClick={() => {
                  setPollTimedOut(false);
                  pollAttemptsRef.current = 0;
                  void fetchOrder();
                }}
                className="ml-2 font-medium underline underline-offset-2"
              >
                Durumu Yenile
              </button>
            </div>
          )}
        </div>
      </main>
    );
  }

  if (order.paymentStatus === "FAILED") {
    return (
      <main className="min-h-screen bg-cream text-ink">
        <div className="mx-auto flex max-w-2xl flex-col items-center px-5 py-24 text-center sm:px-8">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <h1 className="font-serif text-2xl text-ink">Ödeme Alınamadı</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-brown-muted">
            Ödemeniz tamamlanamadı. Dilerseniz ödeme adımına dönüp tekrar
            deneyebilirsiniz.
          </p>
          <Link
            href={`/odeme/${order.orderNumber}`}
            className="mt-6 flex h-12 items-center justify-center bg-rust px-7 text-sm font-medium text-cream transition hover:bg-rust-dark"
          >
            Ödemeyi Tekrar Dene
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream text-ink">
      <div className="mx-auto max-w-2xl px-5 py-16 sm:px-8">
        {/* Success header */}
        <div className="mb-10 flex flex-col items-center gap-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-10 w-10 text-green-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <h1 className="font-serif text-2xl text-ink">Siparişiniz Alındı!</h1>
            <p className="mt-2 text-brown-muted">
              Siparişiniz en kısa sürede hazırlanacak.
            </p>
          </div>
          <div className="rounded border border-brown-muted/15 bg-cream-soft px-5 py-3 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-brown-muted">
              Sipariş Numarası
            </p>
            <p className="mt-1 font-mono text-lg font-semibold text-ink">{order.orderNumber}</p>
          </div>
        </div>

        {/* Order items */}
        <div className="border border-brown-muted/15 bg-cream-soft">
          <div className="border-b border-brown-muted/15 px-6 py-4">
            <h2 className="font-semibold text-ink">Sipariş Detayı</h2>
          </div>

          <div className="flex flex-col divide-y divide-brown-muted/15">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-brown-muted/15 bg-cream">
                  <ProductImage
                    src={item.productImageUrl ? `${apiUrl}/images/products/${item.productImageUrl}` : undefined}
                    alt={item.productImageAlt ?? item.productName}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-ink">{item.productName}</p>
                  <p className="mt-0.5 text-sm text-brown-muted">
                    {item.quantity} adet × {formatPrice(item.unitPriceKurus, order.currency)}
                  </p>
                </div>
                <p className="font-semibold text-ink">
                  {formatPrice(item.lineTotalKurus, order.currency)}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 border-t border-brown-muted/15 px-6 py-4 text-sm">
            <div className="flex justify-between">
              <span className="text-brown-muted">Ara Toplam</span>
              <span className="text-ink">{formatPrice(order.subtotalKurus, order.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brown-muted">Kargo</span>
              <span className={order.shippingKurus > 0 ? "text-ink" : "text-green-600"}>
                {order.shippingKurus > 0
                  ? formatPrice(order.shippingKurus, order.currency)
                  : "Ücretsiz"}
              </span>
            </div>
            {order.discountKurus > 0 && (
              <div className="flex justify-between">
                <span className="text-brown-muted">İndirim{order.discountCode ? ` (${order.discountCode})` : ""}</span>
                <span className="text-emerald-600">-{formatPrice(order.discountKurus, order.currency)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-brown-muted/15 pt-3 text-base font-semibold text-ink">
              <span>Toplam</span>
              <span>{formatPrice(order.totalKurus, order.currency)}</span>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={user ? "/hesabim" : "/giris?redirect=/hesabim"}
            className="flex h-12 w-full items-center justify-center bg-rust text-sm font-medium text-cream transition hover:bg-rust-dark sm:flex-1"
          >
            {user ? "Siparişlerimi Görüntüle" : "Üye Girişi Yap"}
          </Link>
          <Link
            href="/"
            className="flex h-12 w-full items-center justify-center border border-brown-muted/20 bg-cream-soft text-sm font-medium text-ink transition hover:border-rust-dark sm:flex-1"
          >
            Alışverişe Devam Et
          </Link>
        </div>
      </div>
    </main>
  );
}
