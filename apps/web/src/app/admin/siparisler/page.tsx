"use client";

import { Fragment, useEffect, useState } from "react";
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

type OrderDetail = Order & { items: OrderItem[] };

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
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  async function toggleExpand(order: Order) {
    if (expandedId === order.id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(order.id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const token = await user!.getIdToken();
      const d = await apiFetch<OrderDetail>(`/admin/orders/${order.id}`, token);
      setDetail(d);
    } catch {
      // ignore
    } finally {
      setDetailLoading(false);
    }
  }

  async function updateStatus(orderId: string, newStatus: string) {
    if (!user) return;
    setUpdatingId(orderId);
    try {
      const token = await user.getIdToken();
      await apiFetch(`/admin/orders/${orderId}/status`, token, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );
      if (detail?.id === orderId) {
        setDetail((d) => (d ? { ...d, status: newStatus } : d));
      }
    } catch {
      // ignore
    } finally {
      setUpdatingId(null);
    }
  }

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
      <div className="border border-neutral-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-950" />
          </div>
        ) : orders.length === 0 ? (
          <p className="py-24 text-center text-sm text-neutral-400">Bu durumda sipariş bulunmuyor.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-neutral-600">Sipariş No</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-neutral-600">Müşteri</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-neutral-600 hidden md:table-cell">Şehir</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-neutral-600 hidden sm:table-cell">Adet</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-neutral-600">Durum</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.1em] text-neutral-600">Toplam</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <Fragment key={order.id}>
                  <tr
                    className={`border-b border-neutral-100 transition-colors hover:bg-neutral-50 ${expandedId === order.id ? "bg-neutral-50" : ""}`}
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
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => toggleExpand(order)}
                        className="text-xs font-medium text-neutral-500 hover:text-neutral-950"
                      >
                        {expandedId === order.id ? "Kapat ▲" : "Detay ▼"}
                      </button>
                    </td>
                  </tr>

                  {expandedId === order.id && (
                    <tr className="border-b border-neutral-100 bg-neutral-50">
                      <td colSpan={7} className="px-5 py-5">
                        {detailLoading ? (
                          <div className="flex justify-center py-4">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-950" />
                          </div>
                        ) : detail ? (
                          <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
                            {/* Items */}
                            <div className="flex-1">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Ürünler</p>
                              <div className="flex flex-col gap-1.5">
                                {detail.items.map((item) => (
                                  <div key={item.id} className="flex items-center justify-between text-sm">
                                    <span className="text-neutral-700">{item.productName} <span className="text-neutral-500">× {item.quantity}</span></span>
                                    <span className="font-medium text-neutral-950">{formatPrice(item.lineTotalKurus, detail.currency)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Status update */}
                            <div className="shrink-0">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Durumu Güncelle</p>
                              <div className="flex flex-col gap-2">
                                {ALL_STATUSES.map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    disabled={detail.status === s || updatingId === order.id}
                                    onClick={() => updateStatus(order.id, s)}
                                    className={`px-4 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed ${
                                      detail.status === s
                                        ? "bg-neutral-950 text-white"
                                        : "border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-950 hover:text-neutral-950 disabled:opacity-50"
                                    }`}
                                  >
                                    {updatingId === order.id && detail.status !== s ? "..." : STATUS_LABELS[s]}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
