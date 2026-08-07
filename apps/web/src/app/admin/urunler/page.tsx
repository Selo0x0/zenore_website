"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";
import { formatPrice, apiUrl } from "@/app/products/product-data";

function resolveImageUrl(url: string) {
  return url.startsWith("http") ? url : `${apiUrl}/images/products/${url}`;
}

type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  priceKurus: number;
  currency: string;
  stockQuantity: number;
  category: { id: string; name: string } | null;
  images: { url: string; alt: string | null }[];
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Aktif",
  DRAFT: "Taslak",
  ARCHIVED: "Arşiv",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  DRAFT: "bg-neutral-100 text-neutral-600",
  ARCHIVED: "bg-red-100 text-red-600",
};

const TABS = [
  { key: "ALL", label: "Tümü" },
  { key: "ACTIVE", label: "Aktif" },
  { key: "DRAFT", label: "Taslak" },
  { key: "ARCHIVED", label: "Arşiv" },
];

export default function AdminUrunlerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [confirmBulk, setConfirmBulk] = useState<"archive" | "delete" | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  function showToast(message: string, type: "success" | "error" = "success") {
    setToastMsg(message);
    setToastType(type);
    setTimeout(() => setToastMsg(null), 2800);
  }

  useEffect(() => {
    if (searchParams.get("saved")) {
      // syncing toast visibility with a one-time URL param, not derived render state
      // eslint-disable-next-line react-hooks/set-state-in-effect
      showToast("Ürün başarıyla güncellendi");
      router.replace("/admin/urunler");
    }
  }, []);

  async function fetchProducts(status: string, pageNum: number) {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams({ page: String(pageNum) });
      if (status !== "ALL") params.set("status", status);
      const res = await apiFetch<{ products: AdminProduct[]; total: number }>(
        `/admin/products?${params.toString()}`,
        token,
      );
      setProducts(res.products);
      setTotal(res.total);
    } catch {
      showToast("Ürünler yüklenirken bir hata oluştu.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // fetchProducts sets loading=true synchronously before its first await
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchProducts(tab, page);
    setSelectedIds(new Set());
    setConfirmBulk(null);
  }, [user, tab, page]);

  function handleTabChange(key: string) {
    setTab(key);
    setPage(1);
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) =>
      prev.size === products.length ? new Set() : new Set(products.map((p) => p.id)),
    );
  }

  async function handleArchive(id: string, name: string) {
    if (!user) return;
    setBusyId(id);
    try {
      const token = await user.getIdToken();
      await apiFetch(`/admin/products/${id}`, token, { method: "DELETE" });
      setProducts((prev) =>
        tab === "ALL"
          ? prev.map((p) => (p.id === id ? { ...p, status: "ARCHIVED" as const } : p))
          : prev.filter((p) => p.id !== id),
      );
      setTotal((t) => (tab === "ALL" ? t : t - 1));
      showToast(`"${name}" arşivlendi.`);
    } catch {
      showToast(`"${name}" arşivlenemedi.`, "error");
    } finally {
      setBusyId(null);
      setConfirmingId(null);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!user) return;
    setBusyId(id);
    try {
      const token = await user.getIdToken();
      await apiFetch(`/admin/products/${id}/permanent`, token, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setTotal((t) => t - 1);
      showToast(`"${name}" kalıcı olarak silindi.`);
    } catch {
      showToast(`"${name}" silinemedi.`, "error");
    } finally {
      setBusyId(null);
      setConfirmingId(null);
    }
  }

  async function handleBulkArchive() {
    if (!user) return;
    const ids = [...selectedIds];
    setBulkBusy(true);
    try {
      const token = await user.getIdToken();
      const results = await Promise.allSettled(
        ids.map((id) => apiFetch(`/admin/products/${id}`, token, { method: "DELETE" })),
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      setProducts((prev) =>
        tab === "ALL"
          ? prev.map((p) => (selectedIds.has(p.id) ? { ...p, status: "ARCHIVED" as const } : p))
          : prev.filter((p) => !selectedIds.has(p.id)),
      );
      setTotal((t) => (tab === "ALL" ? t : t - (ids.length - failed)));
      setSelectedIds(new Set());
      showToast(
        failed > 0
          ? `${ids.length - failed} ürün arşivlendi, ${failed} ürün başarısız oldu.`
          : `${ids.length} ürün arşivlendi.`,
        failed > 0 ? "error" : "success",
      );
    } finally {
      setBulkBusy(false);
      setConfirmBulk(null);
    }
  }

  async function handleBulkDelete() {
    if (!user) return;
    const ids = [...selectedIds];
    setBulkBusy(true);
    try {
      const token = await user.getIdToken();
      const results = await Promise.allSettled(
        ids.map((id) => apiFetch(`/admin/products/${id}/permanent`, token, { method: "DELETE" })),
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      setProducts((prev) => prev.filter((p) => !selectedIds.has(p.id)));
      setTotal((t) => t - (ids.length - failed));
      setSelectedIds(new Set());
      showToast(
        failed > 0
          ? `${ids.length - failed} ürün silindi, ${failed} ürün başarısız oldu.`
          : `${ids.length} ürün kalıcı olarak silindi.`,
        failed > 0 ? "error" : "success",
      );
    } finally {
      setBulkBusy(false);
      setConfirmBulk(null);
    }
  }

  const allSelected = products.length > 0 && selectedIds.size === products.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-800">Ürünler</h1>
          <p className="mt-1 text-sm text-neutral-500">{total} ürün</p>
        </div>
        <Link
          href="/admin/urunler/yeni"
          className="bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          + Yeni Ürün
        </Link>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-neutral-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => handleTabChange(t.key)}
            className={`shrink-0 border-b-2 -mb-px px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? "border-neutral-950 text-neutral-950"
                : "border-transparent text-neutral-500 hover:text-neutral-950"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-neutral-950 bg-neutral-950 px-4 py-3 text-white">
          <p className="text-sm font-medium">{selectedIds.size} ürün seçildi</p>
          <div className="flex items-center gap-2">
            {confirmBulk ? (
              <>
                <span className="text-sm text-neutral-300">
                  {confirmBulk === "archive"
                    ? "Seçilenleri arşivlemek istediğinizden emin misiniz?"
                    : "Seçilenleri kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."}
                </span>
                <button
                  type="button"
                  disabled={bulkBusy}
                  onClick={confirmBulk === "archive" ? handleBulkArchive : handleBulkDelete}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {bulkBusy ? "İşleniyor..." : "Evet, Onayla"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmBulk(null)}
                  className="rounded-md border border-neutral-600 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:border-neutral-400"
                >
                  Vazgeç
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setConfirmBulk("archive")}
                  className="rounded-md border border-neutral-600 px-3 py-1.5 text-xs font-medium text-white transition hover:border-neutral-400"
                >
                  Arşivle
                </button>
                {tab === "ARCHIVED" && (
                  <button
                    type="button"
                    onClick={() => setConfirmBulk("delete")}
                    className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700"
                  >
                    Sil
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="rounded-md border border-neutral-600 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:border-neutral-400"
                >
                  Seçimi Temizle
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="border border-neutral-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-950" />
          </div>
        ) : products.length === 0 ? (
          <p className="py-24 text-center text-sm text-neutral-400">Bu durumda ürün bulunmuyor.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="w-10 px-5 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 accent-neutral-950"
                    aria-label="Tümünü seç"
                  />
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-neutral-600">Ürün</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-neutral-600 hidden md:table-cell">Kategori</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-neutral-600">Fiyat</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-neutral-600">Stok</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-neutral-600">Durum</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                  <td className="px-5 py-3.5">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(product.id)}
                      onChange={() => toggleSelected(product.id)}
                      className="h-4 w-4 accent-neutral-950"
                      aria-label={`${product.name} seç`}
                    />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {product.images[0] ? (
                        <img
                          src={resolveImageUrl(product.images[0].url)}
                          alt={product.images[0].alt ?? product.name}
                          className="h-10 w-10 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-neutral-100">
                          <svg className="h-4 w-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-neutral-950">{product.name}</p>
                        <p className="font-mono text-xs text-neutral-500">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-neutral-700 hidden md:table-cell">
                    {product.category?.name ?? <span className="text-neutral-400">—</span>}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-neutral-950">
                    {formatPrice(product.priceKurus, product.currency)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`font-medium ${product.stockQuantity <= 5 ? "text-red-600" : "text-neutral-950"}`}>
                      {product.stockQuantity}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[product.status] ?? "bg-neutral-100 text-neutral-600"}`}>
                      {STATUS_LABELS[product.status] ?? product.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {confirmingId === product.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={busyId === product.id}
                          onClick={() =>
                            product.status === "ARCHIVED"
                              ? handleDelete(product.id, product.name)
                              : handleArchive(product.id, product.name)
                          }
                          className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {busyId === product.id ? "İşleniyor..." : "Evet, Onayla"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingId(null)}
                          className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:border-neutral-400"
                        >
                          Vazgeç
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/urunler/${product.id}`}
                          className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-950"
                        >
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Düzenle
                        </Link>
                        {product.status !== "ARCHIVED" && (
                          <button
                            type="button"
                            onClick={() => setConfirmingId(product.id)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:border-red-200 hover:bg-red-100"
                          >
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" />
                            </svg>
                            Arşivle
                          </button>
                        )}
                        {product.status === "ARCHIVED" && (
                          <button
                            type="button"
                            onClick={() => setConfirmingId(product.id)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-red-700"
                          >
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                            Sil
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && products.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            Sayfa {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Önceki
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sonraki
            </button>
          </div>
        </div>
      )}

      {toastMsg && <AdminToast message={toastMsg} type={toastType} />}
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
