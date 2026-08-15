"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";
import { formatPrice } from "@/app/products/product-data";
import { AdminToast } from "../../admin-toast";

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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brown-muted/15 border-t-rust" />
      </div>
    );
  }

  if (notFound || !customer) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <p className="text-sm text-brown-muted">Müşteri bulunamadı.</p>
        <button
          type="button"
          onClick={() => router.push("/admin/musteriler")}
          className="mt-4 text-sm font-medium text-ink underline underline-offset-2"
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
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      {toast && <AdminToast message={toast.message} type={toast.type} />}

      {/* Breadcrumb */}
      <div className="mb-8 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/musteriler")}
          className="text-sm text-brown-muted hover:text-ink"
        >
          ← Müşteriler
        </button>
        <span className="text-brown-muted">/</span>
        <h1 className="font-serif text-2xl tracking-tight text-ink">
          {customer.displayName ?? customer.email}
        </h1>
      </div>

      {/* Profile header */}
      <div className="mb-6 flex flex-col gap-6 rounded-xl border border-brown-muted/15 bg-cream-soft p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-rust text-lg font-semibold text-cream">
            {initial}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-ink">{customer.displayName ?? "İsimsiz"}</p>
              {customer.isAdmin && (
                <span className="inline-flex rounded-full bg-rust px-2.5 py-0.5 text-xs font-medium text-cream">Admin</span>
              )}
            </div>
            <p className="text-sm text-brown-muted">{customer.email}</p>
            {customer.phone && <p className="text-sm text-brown-muted">{customer.phone}</p>}
          </div>
        </div>
        <p className="text-xs text-brown-muted">
          Katılım: {new Date(customer.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-brown-muted/15 bg-cream-soft p-5">
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-brown-muted">Sipariş</p>
          <p className="mt-1.5 text-2xl font-semibold text-ink">{customer.orders.length}</p>
        </div>
        <div className="rounded-xl border border-brown-muted/15 bg-cream-soft p-5">
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-brown-muted">Toplam Harcama</p>
          <p className="mt-1.5 text-2xl font-semibold text-ink">{formatPrice(totalSpentKurus, currency)}</p>
        </div>
        <div className="rounded-xl border border-brown-muted/15 bg-cream-soft p-5">
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-brown-muted">Adres</p>
          <p className="mt-1.5 text-2xl font-semibold text-ink">{customer.addresses.length}</p>
        </div>
      </div>

      {/* Orders + Addresses */}
      <div className="mb-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-brown-muted/15 bg-cream-soft p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.1em] text-brown-muted">Siparişler</h2>
          {customer.orders.length === 0 ? (
            <p className="text-sm text-brown-muted">Henüz sipariş yok.</p>
          ) : (
            <div className="flex flex-col divide-y divide-brown-muted/10">
              {customer.orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-mono text-xs font-medium text-ink">{o.orderNumber}</p>
                    <p className="text-xs text-brown-muted">
                      {new Date(o.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <span className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[o.status] ?? "bg-cream text-brown"}`}>
                    {STATUS_LABELS[o.status] ?? o.status}
                  </span>
                  <span className="shrink-0 font-semibold text-ink">{formatPrice(o.totalKurus, o.currency)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-brown-muted/15 bg-cream-soft p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.1em] text-brown-muted">Adresler</h2>
          {customer.addresses.length === 0 ? (
            <p className="text-sm text-brown-muted">Kayıtlı adres yok.</p>
          ) : (
            <div className="flex flex-col divide-y divide-brown-muted/10">
              {customer.addresses.map((a) => (
                <div key={a.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-ink">{a.label || a.fullName}</p>
                    {a.isDefault && (
                      <span className="rounded-full bg-cream px-2 py-0.5 text-[10px] font-medium text-brown-muted">Varsayılan</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs leading-5 text-brown-muted">{a.address}, {a.district}/{a.city}</p>
                  <p className="text-xs text-brown-muted">{a.phone}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Admin access */}
      <div className="rounded-xl border border-brown-muted/15 bg-cream-soft p-6">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-[0.1em] text-brown-muted">Admin Yetkisi</h2>
        <p className="mb-4 text-sm text-brown-muted">
          {customer.isAdmin
            ? "Bu müşteri admin panele erişebilir."
            : "Bu müşteri şu anda standart bir kullanıcıdır."}
        </p>

        {confirmDemote ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-brown">Admin yetkisini kaldırmak istediğinize emin misiniz?</p>
            <button
              type="button"
              onClick={() => setAdmin(false)}
              disabled={updating}
              className="bg-red-600 px-4 py-2 text-xs font-medium text-cream hover:bg-red-700 disabled:opacity-50"
            >
              Onayla
            </button>
            <button
              type="button"
              onClick={() => setConfirmDemote(false)}
              className="border border-brown-muted/15 px-4 py-2 text-xs font-medium text-brown hover:border-rust"
            >
              Vazgeç
            </button>
          </div>
        ) : customer.isAdmin ? (
          <button
            type="button"
            onClick={() => setConfirmDemote(true)}
            disabled={updating}
            className="border border-brown-muted/15 bg-cream-soft px-5 py-2.5 text-sm font-medium text-brown transition hover:border-red-600 hover:text-red-600 disabled:opacity-50"
          >
            Adminlikten Çıkar
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setAdmin(true)}
            disabled={updating}
            className="bg-rust px-5 py-2.5 text-sm font-medium text-cream transition hover:bg-rust-dark disabled:opacity-50"
          >
            {updating ? "..." : "Admin Yap"}
          </button>
        )}
      </div>
    </div>
  );
}
