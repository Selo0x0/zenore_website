"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";
import { ImageUploadField } from "../../image-upload-field";

type Category = { id: string; name: string };

function toSlug(str: string) {
  return str
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function YeniUrunPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugManual, setSlugManual] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [status, setStatus] = useState("DRAFT");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([""]);;

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const cats = await apiFetch<Category[]>("/admin/categories", token);
        setCategories(cats);
      } catch {
        // ignore
      }
    })();
  }, [user]);

  function handleNameChange(val: string) {
    setName(val);
    if (!slugManual) setSlug(toSlug(val));
  }

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
      await apiFetch("/admin/products", token, {
        method: "POST",
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
      router.push("/admin/urunler");
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
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
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-800">Yeni Ürün</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Field label="Ürün Adı *">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Örn: Hakiki Deri Cüzdan"
            className={inputCls}
          />
        </Field>

        <Field label="Slug *" hint="URL'de kullanılır — otomatik oluşturulur, düzenleyebilirsiniz.">
          <input
            type="text"
            required
            value={slug}
            onChange={(e) => { setSlugManual(true); setSlug(e.target.value); }}
            placeholder="hakiki-deri-cuzdan"
            className={`${inputCls} font-mono`}
          />
        </Field>

        <Field label="Açıklama">
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ürün açıklaması..."
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
              placeholder="499.90"
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
                  className="shrink-0 self-start px-3 pt-2 text-neutral-400 hover:text-red-500"
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
            {saving ? "Kaydediliyor..." : "Ürünü Oluştur"}
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

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-600">{label}</label>
      {children}
      {hint && <p className="text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}
