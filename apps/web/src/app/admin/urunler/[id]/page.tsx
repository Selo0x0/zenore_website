"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";
import { ImageUploadField } from "../../image-upload-field";

type Category = { id: string; name: string };
type ProductImage = { id: string; url: string; alt: string | null; sortOrder: number };
type FullProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceKurus: number;
  stockQuantity: number;
  status: string;
  category: { id: string; name: string } | null;
  images: ProductImage[];
};

export default function EditUrunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [status, setStatus] = useState("DRAFT");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([""]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const [product, cats] = await Promise.all([
          apiFetch<FullProduct>(`/admin/products/${id}`, token),
          apiFetch<Category[]>("/admin/categories", token),
        ]);
        setName(product.name);
        setSlug(product.slug);
        setDescription(product.description ?? "");
        setPrice((product.priceKurus / 100).toFixed(2));
        setStock(String(product.stockQuantity));
        setStatus(product.status);
        setCategoryId(product.category?.id ?? "");
        setImageUrls(product.images.length > 0 ? product.images.map((img) => img.url) : [""]);
        setCategories(cats);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [user, id]);

  function updateImageUrl(i: number, val: string) {
    setImageUrls((prev) => prev.map((u, idx) => (idx === i ? val : u)));
  }

  function removeImageUrl(i: number) {
    setImageUrls((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const priceKurus = Math.round(parseFloat(price.replace(",", ".")) * 100);
      if (isNaN(priceKurus) || priceKurus <= 0) {
        setError("Geçerli bir fiyat girin.");
        setSaving(false);
        return;
      }
      await apiFetch(`/admin/products/${id}`, token, {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || undefined,
          priceKurus,
          stockQuantity: parseInt(stock, 10) || 0,
          status,
          categoryId: categoryId || undefined,
          imageUrls: imageUrls.filter((u) => u.trim()),
        }),
      });
      router.push("/admin/urunler?saved=1");
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-950" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <div className="mb-8 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/urunler")}
          className="text-sm text-neutral-500 hover:text-neutral-950"
        >
          ← Ürünler
        </button>
        <span className="text-neutral-300">/</span>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-800">Ürünü Düzenle</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Field label="Ürün Adı *">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="Slug *">
          <input
            type="text"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className={`${inputCls} font-mono`}
          />
        </Field>

        <Field label="Açıklama">
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputCls} resize-none`}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Fiyat (₺) *">
            <input
              type="text"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Stok">
            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Durum">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
              <option value="DRAFT">Taslak</option>
              <option value="ACTIVE">Aktif</option>
              <option value="ARCHIVED">Arşiv</option>
            </select>
          </Field>
          <Field label="Kategori">
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
              <option value="">Kategori seçin</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-600">Görseller</span>
          {imageUrls.map((url, i) => (
            <div key={i} className="flex gap-2">
              <ImageUploadField value={url} onChange={(v) => updateImageUrl(i, v)} className="flex-1" />
              {imageUrls.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeImageUrl(i)}
                  className="shrink-0 self-start px-2 pt-2 text-neutral-400 hover:text-red-500"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setImageUrls((prev) => [...prev, ""])}
            className="self-start text-xs font-medium text-neutral-500 hover:text-neutral-950"
          >
            + Görsel Ekle
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 border-t border-neutral-100 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-neutral-950 px-6 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/urunler")}
            className="border border-neutral-200 px-6 py-2 text-sm font-medium text-neutral-600 transition hover:border-neutral-950 hover:text-neutral-950"
          >
            İptal
          </button>
        </div>
      </form>


    </div>
  );
}

const inputCls =
  "w-full border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-950 outline-none focus:border-neutral-950";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-600">{label}</label>
      {children}
    </div>
  );
}
