"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";
import { AdminToast } from "../admin-toast";

type FaqItem = {
  question: string;
  answer: string;
};

type FaqContent = {
  hero: string;
  heroSub: string;
  items: FaqItem[];
};

const DEFAULT: FaqContent = {
  hero: "Sıkça Sorulan Sorular",
  heroSub: "Sipariş, kargo, ödeme ve ürün bakımı hakkında en çok merak edilen konular.",
  items: [
    {
      question: "Siparişim ne zaman kargoya verilir?",
      answer: "Stokta bulunan ürünler genellikle 1-3 iş günü içinde hazırlanıp kargoya teslim edilir.",
    },
  ],
};

const emptyItem: FaqItem = {
  question: "",
  answer: "",
};

export default function AdminSorularPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<FaqContent>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    apiFetch<FaqContent>("/site-content/faq")
      .then((data) => {
        setForm({
          hero: data.hero ?? DEFAULT.hero,
          heroSub: data.heroSub ?? DEFAULT.heroSub,
          items: Array.isArray(data.items) ? data.items : [],
        });
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSave() {
    if (!user) return;

    const items = form.items
      .map((item) => ({
        question: item.question.trim(),
        answer: item.answer.trim(),
      }))
      .filter((item) => item.question && item.answer);

    if (!form.hero.trim() || !form.heroSub.trim()) {
      showToast("Başlık ve açıklama boş olamaz.", "error");
      return;
    }

    setSaving(true);
    try {
      const token = await user.getIdToken();
      await apiFetch("/admin/site-content/faq", token, {
        method: "PUT",
        body: JSON.stringify({
          hero: form.hero.trim(),
          heroSub: form.heroSub.trim(),
          items,
        }),
      });
      setForm((current) => ({ ...current, items }));
      showToast("Kaydedildi", "success");
    } catch {
      showToast("Kaydetme başarısız", "error");
    } finally {
      setSaving(false);
    }
  }

  function updateItem(index: number, field: keyof FaqItem, value: string) {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function addItem() {
    setForm((current) => ({ ...current, items: [...current.items, emptyItem] }));
  }

  function removeItem(index: number) {
    setForm((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function moveItem(index: number, direction: -1 | 1) {
    setForm((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.items.length) return current;
      const items = [...current.items];
      const [item] = items.splice(index, 1);
      items.splice(nextIndex, 0, item);
      return { ...current, items };
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brown-muted/15 border-t-rust" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      {toast && <AdminToast message={toast.message} type={toast.type} />}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl text-ink">Sıkça Sorulan Sorular</h1>
          <p className="mt-1 text-sm text-brown-muted">Q&A sayfasının başlık ve soru cevaplarını düzenle</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-rust px-6 py-2.5 text-sm font-medium text-cream transition hover:bg-rust-dark disabled:opacity-50"
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>

      <div className="rounded border border-brown-muted/15 bg-cream-soft p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.1em] text-brown-muted">
          Sayfa Başlığı
        </h2>
        <div className="grid gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-brown-muted">Ana Başlık</span>
            <input
              type="text"
              value={form.hero}
              onChange={(e) => setForm((current) => ({ ...current, hero: e.target.value }))}
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-brown-muted">Açıklama</span>
            <input
              type="text"
              value={form.heroSub}
              onChange={(e) => setForm((current) => ({ ...current, heroSub: e.target.value }))}
              className={inputCls}
            />
          </label>
        </div>
      </div>

      <section className="rounded border border-brown-muted/15 bg-cream-soft p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-brown-muted">
            Sorular
          </h2>
          <button
            type="button"
            onClick={addItem}
            className="border border-brown-muted/20 px-4 py-2 text-xs font-medium text-brown transition hover:border-rust hover:text-ink"
          >
            Soru Ekle
          </button>
        </div>

        {form.items.length === 0 ? (
          <div className="flex min-h-32 items-center justify-center border border-dashed border-brown-muted/20 text-sm text-brown-muted">
            Henüz soru eklenmedi
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {form.items.map((item, index) => (
              <div key={index} className="border border-brown-muted/15 bg-cream p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-brown-muted">
                    Soru {index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveItem(index, -1)}
                      disabled={index === 0}
                      aria-label="Soruyu yukarı taşı"
                      className={iconButtonCls}
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 15 12 9l-6 6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(index, 1)}
                      disabled={index === form.items.length - 1}
                      aria-label="Soruyu aşağı taşı"
                      className={iconButtonCls}
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      aria-label="Soruyu sil"
                      className="flex h-8 w-8 items-center justify-center border border-red-200 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="grid gap-4">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-brown-muted">Soru</span>
                    <input
                      type="text"
                      value={item.question}
                      onChange={(e) => updateItem(index, "question", e.target.value)}
                      className={inputCls}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-brown-muted">Cevap</span>
                    <textarea
                      rows={4}
                      value={item.answer}
                      onChange={(e) => updateItem(index, "answer", e.target.value)}
                      className={`${inputCls} resize-none leading-6`}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const inputCls =
  "border border-brown-muted/15 bg-cream-soft px-3 py-2 text-sm text-ink outline-none focus:border-rust";

const iconButtonCls =
  "flex h-8 w-8 items-center justify-center border border-brown-muted/20 text-brown-muted transition hover:border-rust hover:text-ink disabled:cursor-not-allowed disabled:opacity-40";
