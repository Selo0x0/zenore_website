"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";
import { formatPrice, apiUrl } from "@/app/products/product-data";
import { useScrollFade } from "../use-scroll-fade";
import { AdminToast } from "../admin-toast";

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
  DRAFT: "bg-cream text-brown",
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

  async function handleBulkArchive(ids: string[]) {
    if (!user || ids.length === 0) return;
    const idSet = new Set(ids);
    setBulkBusy(true);
    try {
      const token = await user.getIdToken();
      const results = await Promise.allSettled(
        ids.map((id) => apiFetch(`/admin/products/${id}`, token, { method: "DELETE" })),
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      setProducts((prev) =>
        tab === "ALL"
          ? prev.map((p) => (idSet.has(p.id) ? { ...p, status: "ARCHIVED" as const } : p))
          : prev.filter((p) => !idSet.has(p.id)),
      );
      setTotal((t) => (tab === "ALL" ? t : t - (ids.length - failed)));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
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

  async function handleBulkDelete(ids: string[]) {
    if (!user || ids.length === 0) return;
    const idSet = new Set(ids);
    setBulkBusy(true);
    try {
      const token = await user.getIdToken();
      const results = await Promise.allSettled(
        ids.map((id) => apiFetch(`/admin/products/${id}/permanent`, token, { method: "DELETE" })),
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      setProducts((prev) => prev.filter((p) => !idSet.has(p.id)));
      setTotal((t) => t - (ids.length - failed));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
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
  const confirmTarget = products.find((p) => p.id === confirmingId) ?? null;

  const selectedProducts = products.filter((p) => selectedIds.has(p.id));
  const archivableSelectedIds = selectedProducts.filter((p) => p.status !== "ARCHIVED").map((p) => p.id);
  const deletableSelectedIds = selectedProducts.filter((p) => p.status === "ARCHIVED").map((p) => p.id);

  const [tabsScrollRef, tabsCanScrollRight] = useScrollFade<HTMLDivElement>();
  const [tableScrollRef, tableCanScrollRight] = useScrollFade<HTMLDivElement>([loading, products.length]);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl tracking-tight text-ink">Ürünler</h1>
          <p className="mt-1 text-sm text-brown-muted">{total} ürün</p>
        </div>
        <Link
          href="/admin/urunler/yeni"
          className="bg-rust px-4 py-2 text-sm font-medium text-cream transition hover:bg-rust-dark"
        >
          + Yeni Ürün
        </Link>
      </div>

      <div className="relative">
        <div ref={tabsScrollRef} className="flex gap-1 overflow-x-auto no-scrollbar border-b border-brown-muted/15">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => handleTabChange(t.key)}
              className={`shrink-0 border-b-2 -mb-px px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "border-rust text-ink"
                  : "border-transparent text-brown-muted hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tabsCanScrollRight && (
          <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-cream to-transparent" />
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-rust px-4 py-3 text-cream">
          <p className="text-sm font-medium">{selectedIds.size} ürün seçildi</p>
          <div className="flex items-center gap-2">
            {archivableSelectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => setConfirmBulk("archive")}
                className="rounded-md bg-cream px-3 py-1.5 text-xs font-medium text-rust-dark transition hover:bg-cream-soft"
              >
                Arşivle{archivableSelectedIds.length < selectedIds.size ? ` (${archivableSelectedIds.length})` : ""}
              </button>
            )}
            {deletableSelectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => setConfirmBulk("delete")}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-cream transition hover:bg-red-700"
              >
                Kalıcı Sil{deletableSelectedIds.length < selectedIds.size ? ` (${deletableSelectedIds.length})` : ""}
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="rounded-md border border-cream/40 px-3 py-1.5 text-xs font-medium text-cream transition hover:bg-rust-dark"
            >
              Seçimi Temizle
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center border border-brown-muted/15 bg-cream-soft py-24">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-brown-muted/15 border-t-rust" />
        </div>
      ) : products.length === 0 ? (
        <p className="border border-brown-muted/15 bg-cream-soft py-24 text-center text-sm text-brown-muted">
          Bu durumda ürün bulunmuyor.
        </p>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="flex flex-col divide-y divide-brown-muted/10 border border-brown-muted/15 bg-cream-soft sm:hidden">
            {products.map((product) => (
              <div key={product.id} className="flex flex-col gap-3 px-4 py-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(product.id)}
                    onChange={() => toggleSelected(product.id)}
                    className="mt-3 h-4 w-4 shrink-0 accent-rust"
                    aria-label={`${product.name} seç`}
                  />
                  {product.images[0] ? (
                    <img
                      src={resolveImageUrl(product.images[0].url)}
                      alt={product.images[0].alt ?? product.name}
                      className="h-11 w-11 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-cream">
                      <svg className="h-4 w-4 text-brown-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{product.name}</p>
                    <p className="truncate font-mono text-xs text-brown-muted">{product.slug}</p>
                    {product.category && <p className="mt-0.5 text-xs text-brown-muted">{product.category.name}</p>}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-ink">{formatPrice(product.priceKurus, product.currency)}</span>
                  <span className={`font-medium ${product.stockQuantity <= 5 ? "text-red-600" : "text-brown"}`}>
                    {product.stockQuantity} stok
                  </span>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[product.status] ?? "bg-cream text-brown"}`}>
                    {STATUS_LABELS[product.status] ?? product.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/urunler/${product.id}`}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-brown-muted/15 px-2.5 py-1.5 text-xs font-medium text-brown transition hover:border-brown-muted/40 hover:bg-cream hover:text-ink"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Düzenle
                  </Link>
                  {product.status !== "ARCHIVED" ? (
                    <button
                      type="button"
                      onClick={() => setConfirmingId(product.id)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-red-100 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:border-red-200 hover:bg-red-100"
                    >
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" />
                      </svg>
                      Arşivle
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingId(product.id)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-red-200 bg-red-600 px-2.5 py-1.5 text-xs font-medium text-cream transition hover:bg-red-700"
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
              </div>
            ))}
          </div>

          {/* sm and up: table */}
          <div className="relative hidden sm:block">
            <div ref={tableScrollRef} className="overflow-x-auto no-scrollbar border border-brown-muted/15 bg-cream-soft">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brown-muted/10">
                    <th className="w-10 px-5 py-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someSelected;
                        }}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 accent-rust"
                        aria-label="Tümünü seç"
                      />
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-brown">Ürün</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-brown hidden md:table-cell">Kategori</th>
                    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-brown">Fiyat</th>
                    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-brown">Stok</th>
                    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-brown">Durum</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-brown-muted/10 last:border-0 hover:bg-cream">
                      <td className="px-5 py-3.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(product.id)}
                          onChange={() => toggleSelected(product.id)}
                          className="h-4 w-4 accent-rust"
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
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-cream">
                              <svg className="h-4 w-4 text-brown-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                              </svg>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-ink">{product.name}</p>
                            <p className="font-mono text-xs text-brown-muted">{product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-brown hidden md:table-cell">
                        {product.category?.name ?? <span className="text-brown-muted">—</span>}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 font-medium text-ink">
                        {formatPrice(product.priceKurus, product.currency)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <span className={`font-medium ${product.stockQuantity <= 5 ? "text-red-600" : "text-ink"}`}>
                          {product.stockQuantity}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[product.status] ?? "bg-cream text-brown"}`}>
                          {STATUS_LABELS[product.status] ?? product.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/urunler/${product.id}`}
                            className="inline-flex items-center gap-1.5 rounded-md border border-brown-muted/15 px-2.5 py-1 text-xs font-medium text-brown transition hover:border-brown-muted/40 hover:bg-cream hover:text-ink"
                          >
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Düzenle
                          </Link>
                          {product.status !== "ARCHIVED" ? (
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
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmingId(product.id)}
                              className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-600 px-2.5 py-1 text-xs font-medium text-cream transition hover:bg-red-700"
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {tableCanScrollRight && (
              <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-cream-soft to-transparent" />
            )}
          </div>
        </>
      )}

      {!loading && products.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-brown-muted">
            Sayfa {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md border border-brown-muted/15 px-3 py-1.5 text-xs font-medium text-brown transition hover:border-brown-muted/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Önceki
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-md border border-brown-muted/15 px-3 py-1.5 text-xs font-medium text-brown transition hover:border-brown-muted/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sonraki
            </button>
          </div>
        </div>
      )}

      {/* Archive/delete confirmation modal */}
      {confirmTarget && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmingId(null); }}
        >
          <div className="relative z-50 w-full max-w-sm rounded-2xl bg-cream-soft p-5 shadow-2xl ring-1 ring-ink/5 sm:p-8">
            {confirmTarget.status !== "ARCHIVED" ? (
              <>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-amber-50">
                  <svg className="h-5 w-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" />
                  </svg>
                </div>
                <h2 className="font-serif text-base text-ink">
                  &ldquo;{confirmTarget.name}&rdquo; arşivlensin mi?
                </h2>
                <p className="mt-2 text-sm leading-6 text-brown-muted">
                  Arşivlenen ürünler mağazada görünmez. İstediğiniz zaman tekrar aktif hâle getirebilirsiniz.
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleArchive(confirmTarget.id, confirmTarget.name)}
                    disabled={busyId === confirmTarget.id}
                    className="flex-1 rounded-lg bg-rust py-2.5 text-sm font-medium text-cream transition hover:bg-rust-dark disabled:opacity-50"
                  >
                    {busyId === confirmTarget.id ? "Arşivleniyor..." : "Evet, Arşivle"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    className="flex-1 rounded-lg border border-brown-muted/15 py-2.5 text-sm font-medium text-brown transition hover:border-brown-muted/40"
                  >
                    Vazgeç
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
                  <svg className="h-5 w-5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </div>
                <h2 className="font-serif text-base text-ink">
                  &ldquo;{confirmTarget.name}&rdquo; kalıcı olarak silinsin mi?
                </h2>
                <p className="mt-2 text-sm leading-6 text-brown-muted">
                  Bu işlem geri alınamaz.
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleDelete(confirmTarget.id, confirmTarget.name)}
                    disabled={busyId === confirmTarget.id}
                    className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-cream transition hover:bg-red-700 disabled:opacity-50"
                  >
                    {busyId === confirmTarget.id ? "Siliniyor..." : "Evet, Sil"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    className="flex-1 rounded-lg border border-brown-muted/15 py-2.5 text-sm font-medium text-brown transition hover:border-brown-muted/40"
                  >
                    Vazgeç
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bulk archive/delete confirmation modal */}
      {confirmBulk && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmBulk(null); }}
        >
          <div className="relative z-50 w-full max-w-sm rounded-2xl bg-cream-soft p-5 shadow-2xl ring-1 ring-ink/5 sm:p-8">
            {confirmBulk === "archive" ? (
              <>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-amber-50">
                  <svg className="h-5 w-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" />
                  </svg>
                </div>
                <h2 className="font-serif text-base text-ink">
                  {archivableSelectedIds.length} ürün arşivlensin mi?
                </h2>
                <p className="mt-2 text-sm leading-6 text-brown-muted">
                  Arşivlenen ürünler mağazada görünmez. İstediğiniz zaman tekrar aktif hâle getirebilirsiniz.
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleBulkArchive(archivableSelectedIds)}
                    disabled={bulkBusy}
                    className="flex-1 rounded-lg bg-rust py-2.5 text-sm font-medium text-cream transition hover:bg-rust-dark disabled:opacity-50"
                  >
                    {bulkBusy ? "Arşivleniyor..." : "Evet, Arşivle"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmBulk(null)}
                    className="flex-1 rounded-lg border border-brown-muted/15 py-2.5 text-sm font-medium text-brown transition hover:border-brown-muted/40"
                  >
                    Vazgeç
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
                  <svg className="h-5 w-5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </div>
                <h2 className="font-serif text-base text-ink">
                  {deletableSelectedIds.length} ürün kalıcı olarak silinsin mi?
                </h2>
                <p className="mt-2 text-sm leading-6 text-brown-muted">
                  Bu işlem geri alınamaz.
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleBulkDelete(deletableSelectedIds)}
                    disabled={bulkBusy}
                    className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-cream transition hover:bg-red-700 disabled:opacity-50"
                  >
                    {bulkBusy ? "Siliniyor..." : "Evet, Sil"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmBulk(null)}
                    className="flex-1 rounded-lg border border-brown-muted/15 py-2.5 text-sm font-medium text-brown transition hover:border-brown-muted/40"
                  >
                    Vazgeç
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {toastMsg && <AdminToast message={toastMsg} type={toastType} />}
    </div>
  );
}
