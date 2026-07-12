"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";
import { formatPrice } from "@/app/products/product-data";

type OrderItem = {
  id: string;
  productName: string;
  quantity: number;
  unitPriceKurus: number;
  lineTotalKurus: number;
};

type OrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingName: string;
  shippingPhone: string;
  shippingCity: string;
  shippingDistrict: string;
  shippingAddress: string;
  currency: string;
  subtotalKurus: number;
  shippingKurus: number;
  discountCode: string | null;
  discountKurus: number;
  totalKurus: number;
  createdAt: string;
  items: OrderItem[];
};

const ALL_STATUSES = ["PENDING", "CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Beklemede",
  CONFIRMED: "Onaylandı",
  PREPARING: "Hazırlanıyor",
  SHIPPED: "Kargoda",
  DELIVERED: "Teslim Edildi",
  CANCELLED: "İptal",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PREPARING: "bg-purple-100 text-purple-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const PAYMENT_LABELS: Record<string, string> = {
  PENDING: "Ödeme Bekleniyor",
  PAID: "Ödendi",
  FAILED: "Başarısız",
  REFUNDED: "İade Edildi",
};

const PAYMENT_COLORS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
  PAID: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  FAILED: "bg-red-50 text-red-700 border border-red-200",
  REFUNDED: "bg-neutral-100 text-neutral-600 border border-neutral-200",
};

export default function SiparisDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const token = await user.getIdToken();
        const data = await apiFetch<OrderDetail>(`/admin/orders/${id}`, token);
        setOrder(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, id]);

  async function updateStatus(newStatus: string) {
    if (!user) return;
    setUpdating(true);
    try {
      const token = await user.getIdToken();
      await apiFetch(`/admin/orders/${id}/status`, token, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setOrder((prev) => (prev ? { ...prev, status: newStatus } : prev));
    } catch {
      // ignore
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-950" />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <p className="text-sm text-neutral-500">Sipariş bulunamadı.</p>
        <button
          type="button"
          onClick={() => router.push("/admin/siparisler")}
          className="mt-4 text-sm font-medium text-neutral-950 underline underline-offset-2"
        >
          Siparişlere Dön
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      {/* Breadcrumb */}
      <div className="mb-8 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/siparisler")}
          className="text-sm text-neutral-500 hover:text-neutral-950"
        >
          ← Siparişler
        </button>
        <span className="text-neutral-300">/</span>
        <h1 className="font-mono text-2xl font-semibold tracking-tight text-neutral-800">
          {order.orderNumber}
        </h1>
      </div>

      {/* Order header */}
      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-950">{order.customerName}</p>
          <p className="text-sm text-neutral-500">{order.customerEmail}</p>
          <p className="mt-1 text-xs text-neutral-400">
            {new Date(order.createdAt).toLocaleDateString("tr-TR", {
              day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-neutral-100 text-neutral-600"}`}>
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${PAYMENT_COLORS[order.paymentStatus] ?? "bg-neutral-100 text-neutral-600"}`}>
            {PAYMENT_LABELS[order.paymentStatus] ?? order.paymentStatus}
          </span>
        </div>
      </div>

      {/* Items + Shipping */}
      <div className="mb-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.1em] text-neutral-500">Ürünler</h2>
          <div className="flex flex-col divide-y divide-neutral-100">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-neutral-950">{item.productName}</p>
                  <p className="text-xs text-neutral-400">
                    {item.quantity} adet × {formatPrice(item.unitPriceKurus, order.currency)}
                  </p>
                </div>
                <span className="font-semibold text-neutral-950">{formatPrice(item.lineTotalKurus, order.currency)}</span>
              </div>
            ))}
          </div>

          {/* Price breakdown */}
          <div className="mt-4 flex flex-col gap-2 border-t border-neutral-100 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Ara Toplam</span>
              <span className="font-medium text-neutral-950">{formatPrice(order.subtotalKurus, order.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Kargo</span>
              <span className="font-medium text-neutral-950">
                {order.shippingKurus > 0 ? formatPrice(order.shippingKurus, order.currency) : "Ücretsiz"}
              </span>
            </div>
            {order.discountKurus > 0 && (
              <div className="flex justify-between">
                <span className="text-neutral-500">İndirim{order.discountCode ? ` (${order.discountCode})` : ""}</span>
                <span className="font-medium text-emerald-600">-{formatPrice(order.discountKurus, order.currency)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-neutral-100 pt-2 text-base font-semibold">
              <span>Toplam</span>
              <span>{formatPrice(order.totalKurus, order.currency)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.1em] text-neutral-500">Teslimat Adresi</h2>
          <p className="text-sm font-medium text-neutral-950">{order.shippingName}</p>
          <p className="text-sm text-neutral-500">{order.shippingPhone}</p>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            {order.shippingAddress}, {order.shippingDistrict}, {order.shippingCity}
          </p>
        </div>
      </div>

      {/* Status update */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.1em] text-neutral-500">Durumu Güncelle</h2>
        <div className="flex flex-wrap gap-2">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              disabled={order.status === s || updating}
              onClick={() => updateStatus(s)}
              className={`px-4 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed ${
                order.status === s
                  ? "bg-neutral-950 text-white"
                  : "border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-950 hover:text-neutral-950 disabled:opacity-50"
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
