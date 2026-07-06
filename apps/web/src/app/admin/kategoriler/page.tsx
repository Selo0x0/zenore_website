"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isVisible: boolean;
  sortOrder: number;
  parentId: string | null;
  parent: { id: string; name: string } | null;
  _count: { products: number };
};

function toSlug(str: string) {
  return str
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type FormState = { name: string; slug: string; description: string; isVisible: boolean; sortOrder: string; parentId: string };

const emptyForm: FormState = { name: "", slug: "", description: "", isVisible: true, sortOrder: "0", parentId: "" };

export default function AdminKategorilerPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formMode, setFormMode] = useState<"none" | "create" | string>("none");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [slugManual, setSlugManual] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    void loadCategories();
  }, [user]);

  useEffect(() => {
    if (formMode !== "none") {
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [formMode]);

  async function loadCategories() {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const cats = await apiFetch<Category[]>("/admin/categories", token);
      setCategories(cats);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm(emptyForm);
    setSlugManual(false);
    setError(null);
    setFormMode("create");
  }

  function openEdit(cat: Category) {
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? "",
      isVisible: cat.isVisible,
      sortOrder: String(cat.sortOrder),
      parentId: cat.parentId ?? "",
    });
    setSlugManual(true);
    setError(null);
    setFormMode(cat.id);
  }

  function closeForm() {
    setFormMode("none");
    setError(null);
  }

  function handleNameChange(val: string) {
    setForm((f) => ({ ...f, name: val, slug: slugManual ? f.slug : toSlug(val) }));
  }

  async function handleSave() {
    if (!user || !form.name.trim() || !form.slug.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || undefined,
        isVisible: form.isVisible,
        sortOrder: parseInt(form.sortOrder, 10) || 0,
        parentId: form.parentId || null,
      };

      if (formMode === "create") {
        const created = await apiFetch<Category>("/admin/categories", token, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setCategories((prev) => [...prev, created]);
        setSavedMsg("Kategori oluşturuldu");
      } else {
        const updated = await apiFetch<Category>(`/admin/categories/${formMode}`, token, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setCategories((prev) => prev.map((c) => (c.id === formMode ? updated : c)));
        setSavedMsg("Kategori güncellendi");
      }
      closeForm();
      setTimeout(() => setSavedMsg(null), 2500);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Bir hata oluştu.";
      setError(msg);
      setErrorToast(msg);
      setTimeout(() => setErrorToast(null), 3000);
    } finally {
      setSaving(false);
    }
  }

  async function toggleVisibility(cat: Category) {
    if (!user) return;
    setTogglingId(cat.id);
    try {
      const token = await user.getIdToken();
      const updated = await apiFetch<Category>(`/admin/categories/${cat.id}`, token, {
        method: "PATCH",
        body: JSON.stringify({ isVisible: !cat.isVisible }),
      });
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? updated : c)));
    } catch {
      // ignore
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-800">Kategoriler</h1>
          <p className="mt-1 text-sm text-neutral-500">{categories.length} kategori</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          + Yeni Kategori
        </button>
      </div>

      {/* Table */}
      <div className="border border-neutral-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-950" />
          </div>
        ) : categories.length === 0 ? (
          <p className="py-20 text-center text-sm text-neutral-400">Henüz kategori yok.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-neutral-600">Ad</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-neutral-600 hidden md:table-cell">Slug</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-neutral-600 hidden lg:table-cell">Üst Kategori</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-neutral-600">Ürün</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-neutral-600 hidden sm:table-cell">Sıra</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-neutral-600">Görünür</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                  <td className="px-5 py-3.5">
                    <span className="font-medium text-neutral-950">{cat.name}</span>
                    {cat.parent && (
                      <span className="ml-2 text-xs text-neutral-400">↳ {cat.parent.name}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-neutral-600 hidden md:table-cell">{cat.slug}</td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    {cat.parent
                      ? <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">{cat.parent.name}</span>
                      : <span className="rounded-full bg-neutral-950 px-2 py-0.5 text-xs text-white">Ana</span>
                    }
                  </td>
                  <td className="px-5 py-3.5 text-neutral-700">{cat._count.products}</td>
                  <td className="px-5 py-3.5 font-mono text-sm text-neutral-500 hidden sm:table-cell">{cat.sortOrder}</td>
                  <td className="px-5 py-3.5">
                    <button
                      type="button"
                      disabled={togglingId === cat.id}
                      onClick={() => toggleVisibility(cat)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                        cat.isVisible ? "bg-neutral-950" : "bg-neutral-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                          cat.isVisible ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(cat)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-950"
                    >
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Düzenle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {formMode !== "none" && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeForm(); }}
        >
          <div className="relative z-50 w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-neutral-950/5">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-base font-semibold text-neutral-950">
                {formMode === "create" ? "Yeni Kategori" : "Kategoriyi Düzenle"}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-950"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Fields */}
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Ad *</label>
                  <input
                    ref={firstInputRef}
                    type="text"
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Cüzdanlar"
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Slug *</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => { setSlugManual(true); setForm((f) => ({ ...f, slug: e.target.value })); }}
                    placeholder="cüzdanlar"
                    className={`${inputCls} font-mono`}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Üst Kategori</label>
                <select
                  value={form.parentId}
                  onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">— Ana kategori (üst kategori yok)</option>
                  {categories
                    .filter((c) => c.id !== formMode && c.parentId === null)
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Sıra</label>
                  <input
                    type="number"
                    min="0"
                    value={form.sortOrder}
                    onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Görünürlük</label>
                  <label className="flex cursor-pointer items-center gap-2 pt-2.5">
                    <input
                      type="checkbox"
                      checked={form.isVisible}
                      onChange={(e) => setForm((f) => ({ ...f, isVisible: e.target.checked }))}
                      className="h-4 w-4 accent-neutral-950"
                    />
                    <span className="text-sm text-neutral-700">Mağazada göster</span>
                  </label>
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>

            {/* Footer */}
            <div className="mt-6 flex gap-3 border-t border-neutral-100 pt-5">
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="flex-1 rounded-lg bg-neutral-950 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
              >
                {saving ? "Kaydediliyor..." : formMode === "create" ? "Oluştur" : "Kaydet"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="flex-1 rounded-lg border border-neutral-200 py-2.5 text-sm font-medium text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-950"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {savedMsg && <AdminToast message={savedMsg} type="success" />}
      {errorToast && <AdminToast message={errorToast} type="error" />}
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

const inputCls =
  "w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-950 outline-none transition focus:border-neutral-950 focus:bg-white";
