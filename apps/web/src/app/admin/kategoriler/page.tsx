"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";
import { AdminToast } from "../admin-toast";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isVisible: boolean;
  sortOrder: number;
  parentId: string | null;
  parent: { id: string; name: string } | null;
  _count: { products: number; children: number };
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const firstInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (!user) return;
    // loadCategories eventually calls setState after its awaits
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCategories();
  }, [user]);

  useEffect(() => {
    if (formMode !== "none") {
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [formMode]);

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

  async function handleDelete(id: string) {
    if (!user) return;
    setDeletingId(id);
    try {
      const token = await user.getIdToken();
      await apiFetch(`/admin/categories/${id}`, token, { method: "DELETE" });
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setSavedMsg("Kategori silindi");
      setTimeout(() => setSavedMsg(null), 2500);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Silme işlemi başarısız.";
      setErrorToast(msg);
      setTimeout(() => setErrorToast(null), 4000);
    } finally {
      setDeletingId(null);
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
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl tracking-tight text-ink">Kategoriler</h1>
          <p className="mt-1 text-sm text-brown-muted">{categories.length} kategori</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="bg-rust px-4 py-2 text-sm font-medium text-cream transition hover:bg-rust-dark"
        >
          + Yeni Kategori
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center border border-brown-muted/15 bg-cream-soft py-20">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-brown-muted/15 border-t-rust" />
        </div>
      ) : categories.length === 0 ? (
        <p className="border border-brown-muted/15 bg-cream-soft py-20 text-center text-sm text-brown-muted">
          Henüz kategori yok.
        </p>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="flex flex-col divide-y divide-brown-muted/10 border border-brown-muted/15 bg-cream-soft sm:hidden">
            {categories.map((cat) => (
              <div key={cat.id} className="flex flex-col gap-3 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{cat.name}</p>
                    {cat.parent && (
                      <p className="text-xs text-brown-muted">↳ {cat.parent.name}</p>
                    )}
                    <p className="mt-0.5 truncate font-mono text-xs text-brown-muted">{cat.slug}</p>
                  </div>
                  <button
                    type="button"
                    disabled={togglingId === cat.id}
                    onClick={() => toggleVisibility(cat)}
                    aria-label={cat.isVisible ? "Kategoriyi gizle" : "Kategoriyi göster"}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                      cat.isVisible ? "bg-rust" : "bg-brown-muted/15"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-cream-soft shadow transition duration-200 ${
                        cat.isVisible ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-brown-muted">{cat._count.products} ürün · Sıra {cat.sortOrder}</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(cat)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-brown-muted/15 px-2.5 py-1.5 text-xs font-medium text-brown transition hover:border-brown-muted/40 hover:bg-cream hover:text-ink"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Düzenle
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(cat)}
                    className="rounded-md border border-brown-muted/15 px-2.5 py-1.5 text-xs font-medium text-brown-muted transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* sm and up: table */}
          <div className="hidden overflow-x-auto no-scrollbar border border-brown-muted/15 bg-cream-soft sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brown-muted/10">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-brown">Ad</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-brown hidden md:table-cell">Slug</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-brown hidden lg:table-cell">Üst Kategori</th>
                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-brown">Ürün</th>
                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-brown hidden sm:table-cell">Sıra</th>
                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-brown">Görünür</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} className="border-b border-brown-muted/10 last:border-0 hover:bg-cream">
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-ink">{cat.name}</span>
                      {cat.parent && (
                        <span className="ml-2 text-xs text-brown-muted">↳ {cat.parent.name}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-brown hidden md:table-cell">{cat.slug}</td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      {cat.parent
                        ? <span className="rounded-full bg-cream px-2 py-0.5 text-xs text-brown">{cat.parent.name}</span>
                        : <span className="rounded-full bg-rust px-2 py-0.5 text-xs text-cream">Ana</span>
                      }
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-brown">{cat._count.products}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-mono text-sm text-brown-muted hidden sm:table-cell">{cat.sortOrder}</td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <button
                        type="button"
                        disabled={togglingId === cat.id}
                        onClick={() => toggleVisibility(cat)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                          cat.isVisible ? "bg-rust" : "bg-brown-muted/15"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-cream-soft shadow transition duration-200 ${
                            cat.isVisible ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(cat)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-brown-muted/15 px-2.5 py-1 text-xs font-medium text-brown transition hover:border-brown-muted/40 hover:bg-cream hover:text-ink"
                        >
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Düzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(cat)}
                          className="rounded-md border border-brown-muted/15 px-2.5 py-1 text-xs font-medium text-brown-muted transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal */}
      {formMode !== "none" && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeForm(); }}
        >
          <div className="relative z-50 w-full max-w-lg rounded-2xl bg-cream-soft p-5 shadow-2xl ring-1 ring-ink/5 sm:p-8">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-serif text-base text-ink">
                {formMode === "create" ? "Yeni Kategori" : "Kategoriyi Düzenle"}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                className="flex h-7 w-7 items-center justify-center rounded-full text-brown-muted transition hover:bg-cream hover:text-ink"
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
                  <label className="text-xs font-semibold uppercase tracking-[0.1em] text-brown-muted">Ad *</label>
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
                  <label className="text-xs font-semibold uppercase tracking-[0.1em] text-brown-muted">Slug *</label>
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
                <label className="text-xs font-semibold uppercase tracking-[0.1em] text-brown-muted">Üst Kategori</label>
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
                  <label className="text-xs font-semibold uppercase tracking-[0.1em] text-brown-muted">Sıra</label>
                  <input
                    type="number"
                    min="0"
                    value={form.sortOrder}
                    onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.1em] text-brown-muted">Görünürlük</label>
                  <label className="flex cursor-pointer items-center gap-2 pt-2.5">
                    <input
                      type="checkbox"
                      checked={form.isVisible}
                      onChange={(e) => setForm((f) => ({ ...f, isVisible: e.target.checked }))}
                      className="h-4 w-4 accent-neutral-950"
                    />
                    <span className="text-sm text-brown">Mağazada göster</span>
                  </label>
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>

            {/* Footer */}
            <div className="mt-6 flex gap-3 border-t border-brown-muted/10 pt-5">
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="flex-1 rounded-lg bg-rust py-2.5 text-sm font-medium text-cream transition hover:bg-rust-dark disabled:opacity-50"
              >
                {saving ? "Kaydediliyor..." : formMode === "create" ? "Oluştur" : "Kaydet"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="flex-1 rounded-lg border border-brown-muted/15 py-2.5 text-sm font-medium text-brown transition hover:border-brown-muted/40 hover:text-ink"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}
        >
          <div className="relative z-50 w-full max-w-sm rounded-2xl bg-cream-soft p-5 shadow-2xl ring-1 ring-ink/5 sm:p-8">
            {deleteTarget._count.products > 0 || deleteTarget._count.children > 0 ? (
              <>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-amber-50">
                  <svg className="h-5 w-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <h2 className="font-serif text-base text-ink">
                  &ldquo;{deleteTarget.name}&rdquo; silinemez
                </h2>
                <p className="mt-2 text-sm leading-6 text-brown-muted">
                  {deleteTarget._count.products > 0 && (
                    <>Bu kategoride <strong className="text-brown">{deleteTarget._count.products} ürün</strong> var. </>
                  )}
                  {deleteTarget._count.children > 0 && (
                    <>Bu kategorinin <strong className="text-brown">{deleteTarget._count.children} alt kategorisi</strong> var. </>
                  )}
                  Silmeden önce bunları başka bir kategoriye taşıyın.
                </p>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="mt-6 w-full rounded-lg border border-brown-muted/15 py-2.5 text-sm font-medium text-brown transition hover:border-brown-muted/40"
                >
                  Anladım
                </button>
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
                  &ldquo;{deleteTarget.name}&rdquo; silinsin mi?
                </h2>
                <p className="mt-2 text-sm leading-6 text-brown-muted">
                  Bu işlem geri alınamaz.
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleDelete(deleteTarget.id)}
                    disabled={deletingId === deleteTarget.id}
                    className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-cream transition hover:bg-red-700 disabled:opacity-50"
                  >
                    {deletingId === deleteTarget.id ? "Siliniyor..." : "Evet, Sil"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(null)}
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

      {savedMsg && <AdminToast message={savedMsg} type="success" />}
      {errorToast && <AdminToast message={errorToast} type="error" />}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-brown-muted/15 bg-cream px-3 py-2 text-sm text-ink outline-none transition focus:border-rust focus:bg-cream-soft";
