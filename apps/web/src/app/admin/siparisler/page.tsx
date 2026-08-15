"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";
import { formatPrice } from "@/app/products/product-data";
import { useScrollFade } from "../use-scroll-fade";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  customerName: string;
  customerEmail: string;
  shippingCity: string;
  totalKurus: number;
  currency: string;
  createdAt: string;
  items: { quantity: number }[];
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

export default function AdminSiparislerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  async function fetchOrders(status?: string) {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const query = status && status !== "ALL" ? `?status=${status}` : "";
      const res = await apiFetch<{ orders: Order[]; total: number }>(`/admin/orders${query}`, token);
      setOrders(res.orders);
      setTotal(res.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // fetchOrders sets loading=true synchronously before its first await
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchOrders(statusFilter);
  }, [user, statusFilter]);

  const tabs = [{ key: "ALL", label: "Tümü" }, ...ALL_STATUSES.map((s) => ({ key: s, label: STATUS_LABELS[s] }))];

  const [tabsScrollRef, tabsCanScrollRight] = useScrollFade<HTMLDivElement>();
  const [tableScrollRef, tableCanScrollRight] = useScrollFade<HTMLDivElement>([loading, orders.length]);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-ink tracking-tight">Siparişler</h1>
          <p className="mt-1 text-sm text-brown-muted">{total} sipariş</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="relative">
        <div ref={tabsScrollRef} className="flex gap-1 overflow-x-auto no-scrollbar border-b border-brown-muted/15 pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`shrink-0 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                statusFilter === tab.key
                  ? "border-rust text-ink"
                  : "border-transparent text-brown-muted hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Hints that the tab row scrolls further, since the last tab
            otherwise gets cut off flush against the edge with no cue. */}
        {tabsCanScrollRight && (
          <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-cream to-transparent" />
        )}
      </div>

      {/* Orders — a table works fine once there's room for its columns, but
          below sm even 3 columns don't fit without forcing a horizontal
          scroll just to see status or total. A stacked card reads better
          on a narrow screen than a squeezed, partially-hidden table. */}
      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-brown-muted/15 bg-cream-soft py-24">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-brown-muted/15 border-t-rust" />
        </div>
      ) : orders.length === 0 ? (
        <p className="rounded-xl border border-brown-muted/15 bg-cream-soft py-24 text-center text-sm text-brown-muted">
          Bu durumda sipariş bulunmuyor.
        </p>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="flex flex-col divide-y divide-brown-muted/10 rounded-xl border border-brown-muted/15 bg-cream-soft sm:hidden">
            {orders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => router.push(`/admin/siparisler/${order.id}`)}
                className="flex flex-col gap-2 px-4 py-4 text-left transition-colors hover:bg-cream"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-medium text-ink">{order.orderNumber}</span>
                  <span className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-cream text-brown"}`}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-ink">{order.customerName}</p>
                  <p className="text-xs text-brown-muted">{order.customerEmail}</p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-brown-muted">
                    {order.shippingCity} · {order.items.reduce((s, i) => s + i.quantity, 0)} ürün
                  </span>
                  <span className="font-semibold text-ink">{formatPrice(order.totalKurus, order.currency)}</span>
                </div>
              </button>
            ))}
          </div>

          {/* sm and up: table. Still not guaranteed to fit at sm/md, so it
              gets the same scroll + fade-hint treatment as the tabs. */}
          <div className="relative hidden sm:block">
            <div ref={tableScrollRef} className="overflow-x-auto no-scrollbar rounded-xl border border-brown-muted/15 bg-cream-soft">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brown-muted/10 bg-cream">
                    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-brown-muted">Sipariş No</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-brown-muted">Müşteri</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-brown-muted hidden md:table-cell">Şehir</th>
                    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-brown-muted">Adet</th>
                    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-brown-muted">Durum</th>
                    <th className="whitespace-nowrap px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.1em] text-brown-muted">Toplam</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => router.push(`/admin/siparisler/${order.id}`)}
                      className="cursor-pointer border-b border-brown-muted/10 transition-colors last:border-b-0 hover:bg-cream"
                    >
                      <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs font-medium text-ink">{order.orderNumber}</td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-ink">{order.customerName}</p>
                        <p className="text-xs text-brown-muted">{order.customerEmail}</p>
                      </td>
                      <td className="px-5 py-3.5 text-brown hidden md:table-cell">{order.shippingCity}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-brown">
                        {order.items.reduce((s, i) => s + i.quantity, 0)} ürün
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-cream text-brown"}`}>
                          {STATUS_LABELS[order.status] ?? order.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right font-semibold text-ink">
                        {formatPrice(order.totalKurus, order.currency)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-brown-muted">
                        <svg className="ml-auto h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {tableCanScrollRight && (
              <div className="pointer-events-none absolute right-0 top-0 h-full w-8 rounded-r-xl bg-gradient-to-l from-cream-soft to-transparent" />
            )}
          </div>
        </>
      )}
    </div>
  );
}
