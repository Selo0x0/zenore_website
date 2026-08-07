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
  const [archiving, setArchiving] = useState<string | null>(null);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    if (searchParams.get("saved")) {
      // syncing toast visibility with a one-time URL param, not derived render state
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToast(true);
      setTimeout(() => setToast(false), 2500);
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
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // fetchProducts sets loading=true synchronously before its first await
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchProducts(tab, page);
  }, [user, tab, page]);

  function handleTabChange(key: string) {
    setTab(key);
    setPage(1);
  }

  async function handleArchive(id: string, name: string) {
    if (!confirm(`"${name}" ürününü arşivlemek istediğinizden emin misiniz?`)) return;
    if (!user) return;
    setArchiving(id);
    try {
      const token = await user.getIdToken();
      await apiFetch(`/admin/products/${id}`, token, { method: "DELETE" });
      setProducts((prev) =>
        tab === "ALL"
          ? prev.map((p) => (p.id === id ? { ...p, status: "ARCHIVED" as const } : p))
          : prev.filter((p) => p.id !== id),
      );
      setTotal((t) => (tab === "ALL" ? t : t - 1));
    } catch {
      // ignore
    } finally {
      setArchiving(null);
    }
  }

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
                          disabled={archiving === product.id}
                          onClick={() => handleArchive(product.id, product.name)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:border-red-200 hover:bg-red-100 disabled:opacity-40"
                        >
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" />
                          </svg>
                          Arşivle
                        </button>
                      )}
                    </div>
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

      {toast && <AdminToast message="Ürün başarıyla güncellendi" />}
    </div>
  );
}

function AdminToast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 shadow-2xl ring-1 ring-white/5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
        <svg className="h-3.5 w-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <span className="text-sm font-medium text-white">{message}</span>
    </div>
  );
}
