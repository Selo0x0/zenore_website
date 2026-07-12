"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";
import { formatPrice } from "@/app/products/product-data";

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
    void fetchOrders(statusFilter);
  }, [user, statusFilter]);

  const tabs = [{ key: "ALL", label: "Tümü" }, ...ALL_STATUSES.map((s) => ({ key: s, label: STATUS_LABELS[s] }))];

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-neutral-800 font-semibold tracking-tight">Siparişler</h1>
          <p className="mt-1 text-sm text-neutral-500">{total} sipariş</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-neutral-200 pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            className={`shrink-0 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              statusFilter === tab.key
                ? "border-neutral-950 text-neutral-950"
                : "border-transparent text-neutral-500 hover:text-neutral-950"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-950" />
          </div>
        ) : orders.length === 0 ? (
          <p className="py-24 text-center text-sm text-neutral-400">Bu durumda sipariş bulunmuyor.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/60">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Sipariş No</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Müşteri</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500 hidden md:table-cell">Şehir</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500 hidden sm:table-cell">Adet</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Durum</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Toplam</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => router.push(`/admin/siparisler/${order.id}`)}
                  className="cursor-pointer border-b border-neutral-100 transition-colors last:border-b-0 hover:bg-neutral-50"
                >
                  <td className="px-5 py-3.5 font-mono text-xs font-medium text-neutral-950">{order.orderNumber}</td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-neutral-950">{order.customerName}</p>
                    <p className="text-xs text-neutral-500">{order.customerEmail}</p>
                  </td>
                  <td className="px-5 py-3.5 text-neutral-700 hidden md:table-cell">{order.shippingCity}</td>
                  <td className="px-5 py-3.5 text-neutral-700 hidden sm:table-cell">
                    {order.items.reduce((s, i) => s + i.quantity, 0)} ürün
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-neutral-100 text-neutral-600"}`}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-neutral-950">
                    {formatPrice(order.totalKurus, order.currency)}
                  </td>
                  <td className="px-5 py-3.5 text-right text-neutral-300">
                    <svg className="ml-auto h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
