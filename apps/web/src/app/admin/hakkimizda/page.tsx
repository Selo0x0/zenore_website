"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiUrl } from "../../products/product-data";
import { ImageUploadField } from "../image-upload-field";

type Value = { title: string; description: string };
type AboutContent = {
  hero: string;
  heroSub: string;
  story: string;
  values: Value[];
  imageUrl: string;
};

const DEFAULT: AboutContent = {
  hero: "Deriyle Başlayan Bir Hikaye",
  heroSub: "2018'den bu yana hakiki deri ile el işçiliğini buluşturuyoruz.",
  story:
    "Zenore, 2018 yılında İstanbul'da küçük bir atölyede kuruldu. Her ürün, yılların tecrübesiyle seçilen ham derilerden, ustalıkla işlenerek hayata geçirilmektedir.",
  values: [
    { title: "El İşçiliği", description: "Her dikiş, her kesim elle yapılır." },
    { title: "Hakiki Deri", description: "Yalnızca birinci sınıf ham deri kullanıyoruz." },
    { title: "Ömür Boyu Kalite", description: "Onlarca yıl size eşlik edecek ürünler." },
  ],
  imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1200&q=80",
};

export default function AdminHakkimizdaPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<AboutContent>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetch(`${apiUrl}/site-content/about`)
      .then((r) => r.json())
      .then((data: AboutContent) => setForm(data))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${apiUrl}/admin/site-content/about`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      showToast("Kaydedildi", "success");
    } catch {
      showToast("Kaydetme başarısız", "error");
    } finally {
      setSaving(false);
    }
  }

  function updateValue(index: number, field: keyof Value, val: string) {
    setForm((prev) => {
      const values = [...prev.values];
      values[index] = { ...values[index], [field]: val };
      return { ...prev, values };
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-950" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      {toast && <AdminToast message={toast.message} type={toast.type} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-950">Hakkımızda</h1>
          <p className="mt-1 text-sm text-neutral-500">Hakkımızda sayfası içeriğini düzenle</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-neutral-950 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {/* Hero */}
        <div className="rounded border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.1em] text-neutral-500">Hero Bölümü</h2>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-500">Ana Başlık</label>
              <input
                type="text"
                value={form.hero}
                onChange={(e) => setForm((p) => ({ ...p, hero: e.target.value }))}
                className="border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-950 outline-none focus:border-neutral-950"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-500">Alt Başlık</label>
              <input
                type="text"
                value={form.heroSub}
                onChange={(e) => setForm((p) => ({ ...p, heroSub: e.target.value }))}
                className="border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-950 outline-none focus:border-neutral-950"
              />
            </div>
          </div>
        </div>

        {/* Story */}
        <div className="rounded border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.1em] text-neutral-500">Hikaye</h2>
          <div className="flex flex-col gap-4">
            <textarea
              rows={5}
              value={form.story}
              onChange={(e) => setForm((p) => ({ ...p, story: e.target.value }))}
              className="resize-none border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-950 outline-none focus:border-neutral-950"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-500">Görsel</label>
              <ImageUploadField value={form.imageUrl} onChange={(v) => setForm((p) => ({ ...p, imageUrl: v }))} />
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="rounded border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.1em] text-neutral-500">Değerlerimiz</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {form.values.map((v, i) => (
              <div key={i} className="flex flex-col gap-3 border border-neutral-100 p-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-neutral-500">Başlık</label>
                  <input
                    type="text"
                    value={v.title}
                    onChange={(e) => updateValue(i, "title", e.target.value)}
                    className="border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-950 outline-none focus:border-neutral-950"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-neutral-500">Açıklama</label>
                  <textarea
                    rows={3}
                    value={v.description}
                    onChange={(e) => updateValue(i, "description", e.target.value)}
                    className="resize-none border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-950 outline-none focus:border-neutral-950"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
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
