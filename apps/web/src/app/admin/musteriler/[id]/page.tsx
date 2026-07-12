"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";
import { formatPrice } from "@/app/products/product-data";

type Address = {
  id: string;
  label: string | null;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  isDefault: boolean;
};

type CustomerOrder = {
  id: string;
  orderNumber: string;
  status: string;
  totalKurus: number;
  currency: string;
  createdAt: string;
};

type CustomerDetail = {
  id: string;
  email: string;
  displayName: string | null;
  phone: string | null;
  isAdmin: boolean;
  createdAt: string;
  addresses: Address[];
  orders: CustomerOrder[];
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

export default function MusteriDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [confirmDemote, setConfirmDemote] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const token = await user.getIdToken();
        const data = await apiFetch<CustomerDetail>(`/admin/customers/${id}`, token);
        setCustomer(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, id]);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function setAdmin(isAdmin: boolean) {
    if (!user) return;
    setUpdating(true);
    try {
      const token = await user.getIdToken();
      const updated = await apiFetch<{ isAdmin: boolean }>(`/admin/customers/${id}/admin`, token, {
        method: "PATCH",
        body: JSON.stringify({ isAdmin }),
      });
      setCustomer((prev) => (prev ? { ...prev, isAdmin: updated.isAdmin } : prev));
      showToast(isAdmin ? "Admin yetkisi verildi" : "Admin yetkisi kaldırıldı", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "İşlem başarısız", "error");
    } finally {
      setUpdating(false);
      setConfirmDemote(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-950" />
      </div>
    );
  }

  if (notFound || !customer) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <p className="text-sm text-neutral-500">Müşteri bulunamadı.</p>
        <button
          type="button"
          onClick={() => router.push("/admin/musteriler")}
          className="mt-4 text-sm font-medium text-neutral-950 underline underline-offset-2"
        >
          Müşterilere Dön
        </button>
      </div>
    );
  }

  const totalSpentKurus = customer.orders.reduce((sum, o) => sum + o.totalKurus, 0);
  const currency = customer.orders[0]?.currency ?? "TRY";
  const initial = (customer.displayName ?? customer.email)[0]?.toUpperCase() ?? "?";

  return (
    <div className="mx-auto max-w-4xl p-8">
      {toast && <AdminToast message={toast.message} type={toast.type} />}

      {/* Breadcrumb */}
      <div className="mb-8 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/musteriler")}
          className="text-sm text-neutral-500 hover:text-neutral-950"
        >
          ← Müşteriler
        </button>
        <span className="text-neutral-300">/</span>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-800">
          {customer.displayName ?? customer.email}
        </h1>
      </div>

      {/* Profile header */}
      <div className="mb-6 flex flex-col gap-6 rounded-xl border border-neutral-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-lg font-semibold text-white">
            {initial}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-neutral-950">{customer.displayName ?? "İsimsiz"}</p>
              {customer.isAdmin && (
                <span className="inline-flex rounded-full bg-neutral-950 px-2.5 py-0.5 text-xs font-medium text-white">Admin</span>
              )}
            </div>
            <p className="text-sm text-neutral-500">{customer.email}</p>
            {customer.phone && <p className="text-sm text-neutral-500">{customer.phone}</p>}
          </div>
        </div>
        <p className="text-xs text-neutral-400">
          Katılım: {new Date(customer.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-neutral-400">Sipariş</p>
          <p className="mt-1.5 text-2xl font-semibold text-neutral-950">{customer.orders.length}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-neutral-400">Toplam Harcama</p>
          <p className="mt-1.5 text-2xl font-semibold text-neutral-950">{formatPrice(totalSpentKurus, currency)}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-neutral-400">Adres</p>
          <p className="mt-1.5 text-2xl font-semibold text-neutral-950">{customer.addresses.length}</p>
        </div>
      </div>

      {/* Orders + Addresses */}
      <div className="mb-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.1em] text-neutral-500">Siparişler</h2>
          {customer.orders.length === 0 ? (
            <p className="text-sm text-neutral-400">Henüz sipariş yok.</p>
          ) : (
            <div className="flex flex-col divide-y divide-neutral-100">
              {customer.orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-mono text-xs font-medium text-neutral-950">{o.orderNumber}</p>
                    <p className="text-xs text-neutral-400">
                      {new Date(o.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <span className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[o.status] ?? "bg-neutral-100 text-neutral-600"}`}>
                    {STATUS_LABELS[o.status] ?? o.status}
                  </span>
                  <span className="shrink-0 font-semibold text-neutral-950">{formatPrice(o.totalKurus, o.currency)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.1em] text-neutral-500">Adresler</h2>
          {customer.addresses.length === 0 ? (
            <p className="text-sm text-neutral-400">Kayıtlı adres yok.</p>
          ) : (
            <div className="flex flex-col divide-y divide-neutral-100">
              {customer.addresses.map((a) => (
                <div key={a.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-neutral-950">{a.label || a.fullName}</p>
                    {a.isDefault && (
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500">Varsayılan</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs leading-5 text-neutral-500">{a.address}, {a.district}/{a.city}</p>
                  <p className="text-xs text-neutral-400">{a.phone}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Admin access */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-[0.1em] text-neutral-500">Admin Yetkisi</h2>
        <p className="mb-4 text-sm text-neutral-500">
          {customer.isAdmin
            ? "Bu müşteri admin panele erişebilir."
            : "Bu müşteri şu anda standart bir kullanıcıdır."}
        </p>

        {confirmDemote ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-neutral-700">Admin yetkisini kaldırmak istediğinize emin misiniz?</p>
            <button
              type="button"
              onClick={() => setAdmin(false)}
              disabled={updating}
              className="bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              Onayla
            </button>
            <button
              type="button"
              onClick={() => setConfirmDemote(false)}
              className="border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-700 hover:border-neutral-950"
            >
              Vazgeç
            </button>
          </div>
        ) : customer.isAdmin ? (
          <button
            type="button"
            onClick={() => setConfirmDemote(true)}
            disabled={updating}
            className="border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium text-neutral-700 transition hover:border-red-600 hover:text-red-600 disabled:opacity-50"
          >
            Adminlikten Çıkar
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setAdmin(true)}
            disabled={updating}
            className="bg-neutral-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            {updating ? "..." : "Admin Yap"}
          </button>
        )}
      </div>
    </div>
  );
}

function AdminToast({ message, type = "success" }: { message: string; type?: "success" | "error" }) {
  const isError = type === "error";
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 shadow-2xl ring-1 ring-white/5">
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${isError ? "bg-red-500/15" : "bg-emerald-500/15"}`}>
        {isError ? (
          <svg className="h-3.5 w-3.5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <span className="text-sm font-medium text-white">{message}</span>
    </div>
  );
}
