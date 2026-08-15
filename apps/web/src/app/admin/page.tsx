"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";
import { formatPrice } from "@/app/products/product-data";

type Stats = {
  todayOrders: number;
  pendingOrders: number;
  lowStockCount: number;
  todayRevenueKurus: number;
};

type RecentOrder = {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  totalKurus: number;
  currency: string;
  createdAt: string;
};

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

function StatCard({ label, value, sub, icon }: { label: string; value: string | number; sub?: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border border-brown-muted/15 bg-cream-soft p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-brown-muted">{label}</p>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cream text-brown">
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-ink">{value}</p>
      {sub && <p className="text-xs text-brown-muted">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const [s, r] = await Promise.all([
          apiFetch<Stats>("/admin/stats", token),
          apiFetch<RecentOrder[]>("/admin/orders/recent", token),
        ]);
        setStats(s);
        setRecentOrders(r);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const today = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-ink tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-brown-muted">{today}</p>
        </div>
        <Link
          href="/admin/siparisler"
          className="bg-rust px-4 py-2 text-sm font-medium text-cream transition hover:bg-rust-dark"
        >
          Siparişleri Gör
        </Link>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse border border-brown-muted/15 bg-cream-soft" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Bugünkü Sipariş"
            value={stats.todayOrders}
            sub="bugün verilen"
            icon={
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            }
          />
          <StatCard
            label="Bekleyen Sipariş"
            value={stats.pendingOrders}
            sub="işlem bekliyor"
            icon={
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            }
          />
          <StatCard
            label="Az Stoklu Ürün"
            value={stats.lowStockCount}
            sub="5 adet veya daha az"
            icon={
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            }
          />
          <StatCard
            label="Bugünkü Gelir"
            value={formatPrice(stats.todayRevenueKurus, "TRY")}
            sub="bugün toplam"
            icon={
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
              </svg>
            }
          />
        </div>
      ) : null}

      {/* Recent Orders */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-serif text-base text-ink">Son Siparişler</h2>
          <Link href="/admin/siparisler" className="text-sm text-brown-muted hover:text-ink">
            Tümünü Gör →
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center border border-brown-muted/15 bg-cream-soft py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brown-muted/20 border-t-rust" />
          </div>
        ) : recentOrders.length === 0 ? (
          <p className="border border-brown-muted/15 bg-cream-soft py-16 text-center text-sm text-brown-muted">
            Henüz sipariş yok.
          </p>
        ) : (
          <>
            {/* Mobile: card list */}
            <div className="flex flex-col divide-y divide-brown-muted/10 border border-brown-muted/15 bg-cream-soft sm:hidden">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs font-medium text-ink">{order.orderNumber}</p>
                    <p className="truncate text-sm text-brown">{order.customerName}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-cream text-brown"}`}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                    <span className="text-sm font-semibold text-ink">{formatPrice(order.totalKurus, order.currency)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* sm and up: table */}
            <div className="hidden overflow-x-auto no-scrollbar border border-brown-muted/15 bg-cream-soft sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brown-muted/10">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-brown">Sipariş</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-brown">Müşteri</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-brown">Durum</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.1em] text-brown">Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-brown-muted/10 last:border-0 hover:bg-cream">
                      <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs font-medium text-ink">
                        {order.orderNumber}
                      </td>
                      <td className="px-5 py-3.5 text-brown">{order.customerName}</td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-cream text-brown"}`}>
                          {STATUS_LABELS[order.status] ?? order.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right font-semibold text-ink">
                        {formatPrice(order.totalKurus, order.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
