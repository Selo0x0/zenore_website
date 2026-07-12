"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { ProductImage } from "@/app/product-image";
import { apiFetch, apiUrl } from "@/lib/api";
import { formatPrice } from "@/app/products/product-data";

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

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const data = await apiFetch<Order>(`/orders/${orderNumber}`, token);
        setOrder(data);
      } catch {
        // order not found
      } finally {
        setLoading(false);
      }
    })();
  }, [user, orderNumber]);

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-5 py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-950" />
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-neutral-50 text-neutral-950">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 py-32 text-center">
          <p className="text-lg font-semibold">Sipariş bulunamadı.</p>
          <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-950">
            Ana Sayfaya Dön
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
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
            <h1 className="text-2xl font-semibold">Siparişiniz Alındı!</h1>
            <p className="mt-2 text-neutral-500">
              Siparişiniz en kısa sürede hazırlanacak.
            </p>
          </div>
          <div className="rounded border border-neutral-200 bg-white px-5 py-3 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              Sipariş Numarası
            </p>
            <p className="mt-1 font-mono text-lg font-semibold">{order.orderNumber}</p>
          </div>
        </div>

        {/* Order items */}
        <div className="border border-neutral-200 bg-white">
          <div className="border-b border-neutral-100 px-6 py-4">
            <h2 className="font-semibold">Sipariş Detayı</h2>
          </div>

          <div className="flex flex-col divide-y divide-neutral-100">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-neutral-100 bg-stone-100">
                  <ProductImage
                    src={item.productImageUrl ? `${apiUrl}/images/products/${item.productImageUrl}` : undefined}
                    alt={item.productImageAlt ?? item.productName}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.productName}</p>
                  <p className="mt-0.5 text-sm text-neutral-400">
                    {item.quantity} adet × {formatPrice(item.unitPriceKurus, order.currency)}
                  </p>
                </div>
                <p className="font-semibold">
                  {formatPrice(item.lineTotalKurus, order.currency)}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 border-t border-neutral-100 px-6 py-4 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Ara Toplam</span>
              <span>{formatPrice(order.subtotalKurus, order.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Kargo</span>
              <span className="text-green-600">Ücretsiz</span>
            </div>
            {order.discountKurus > 0 && (
              <div className="flex justify-between">
                <span className="text-neutral-500">İndirim{order.discountCode ? ` (${order.discountCode})` : ""}</span>
                <span className="text-emerald-600">-{formatPrice(order.discountKurus, order.currency)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-neutral-100 pt-3 text-base font-semibold">
              <span>Toplam</span>
              <span>{formatPrice(order.totalKurus, order.currency)}</span>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/hesabim"
            className="flex h-12 flex-1 items-center justify-center bg-neutral-950 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Siparişlerimi Görüntüle
          </Link>
          <Link
            href="/"
            className="flex h-12 flex-1 items-center justify-center border border-neutral-200 text-sm font-medium text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
          >
            Alışverişe Devam Et
          </Link>
        </div>
      </div>
    </main>
  );
}
