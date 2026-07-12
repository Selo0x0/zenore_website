"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";
import { formatPrice } from "@/app/products/product-data";

type DiscountType = "PERCENTAGE" | "FIXED";

type DiscountCode = {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  isActive: boolean;
  usageLimit: number | null;
  usageCount: number;
  minOrderKurus: number | null;
  expiresAt: string | null;
  createdAt: string;
};

type FormState = {
  code: string;
  type: DiscountType;
  value: string;
  usageLimit: string;
  minOrderKurus: string;
  expiresAt: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  code: "",
  type: "PERCENTAGE",
  value: "",
  usageLimit: "",
  minOrderKurus: "",
  expiresAt: "",
  isActive: true,
};

function statusOf(d: DiscountCode): { label: string; className: string } {
  if (!d.isActive) return { label: "Pasif", className: "bg-neutral-100 text-neutral-500" };
  if (d.expiresAt && new Date(d.expiresAt) < new Date()) return { label: "Süresi Doldu", className: "bg-red-50 text-red-600" };
  if (d.usageLimit !== null && d.usageCount >= d.usageLimit) return { label: "Tükendi", className: "bg-amber-50 text-amber-700" };
  return { label: "Aktif", className: "bg-emerald-50 text-emerald-700" };
}

export default function AdminIndirimKodlariPage() {
  const { user } = useAuth();
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const [formMode, setFormMode] = useState<"none" | "create" | string>("none");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const firstInputRef = useRef<HTMLInputElement>(null);

  async function loadCodes() {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const data = await apiFetch<DiscountCode[]>("/admin/discount-codes", token);
      setCodes(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    // loadCodes eventually calls setState after its awaits
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCodes();
  }, [user]);

  useEffect(() => {
    if (formMode !== "none") {
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [formMode]);

  function openCreate() {
    setForm(emptyForm);
    setError(null);
    setFormMode("create");
  }

  function openEdit(d: DiscountCode) {
    setForm({
      code: d.code,
      type: d.type,
      value: d.type === "FIXED" ? String(d.value / 100) : String(d.value),
      usageLimit: d.usageLimit !== null ? String(d.usageLimit) : "",
      minOrderKurus: d.minOrderKurus !== null ? String(d.minOrderKurus / 100) : "",
      expiresAt: d.expiresAt ? d.expiresAt.slice(0, 10) : "",
      isActive: d.isActive,
    });
    setError(null);
    setFormMode(d.id);
  }

  function closeForm() {
    setFormMode("none");
    setError(null);
  }

  async function handleGenerate() {
    if (!user) return;
    setGenerating(true);
    try {
      const token = await user.getIdToken();
      const { code } = await apiFetch<{ code: string }>("/admin/discount-codes/generate", token);
      setForm((f) => ({ ...f, code }));
    } catch {
      // ignore
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!user || !form.code.trim() || !form.value.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const payload = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: form.type === "FIXED" ? Math.round(parseFloat(form.value) * 100) : parseInt(form.value, 10),
        usageLimit: form.usageLimit.trim() ? parseInt(form.usageLimit, 10) : null,
        minOrderKurus: form.minOrderKurus.trim() ? Math.round(parseFloat(form.minOrderKurus) * 100) : null,
        expiresAt: form.expiresAt || null,
        isActive: form.isActive,
      };

      if (formMode === "create") {
        const created = await apiFetch<DiscountCode>("/admin/discount-codes", token, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setCodes((prev) => [created, ...prev]);
        setSavedMsg("İndirim kodu oluşturuldu");
      } else {
        const { code: _code, ...updatePayload } = payload;
        const updated = await apiFetch<DiscountCode>(`/admin/discount-codes/${formMode}`, token, {
          method: "PATCH",
          body: JSON.stringify(updatePayload),
        });
        setCodes((prev) => prev.map((c) => (c.id === formMode ? updated : c)));
        setSavedMsg("İndirim kodu güncellendi");
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
      await apiFetch(`/admin/discount-codes/${id}`, token, { method: "DELETE" });
      setCodes((prev) => prev.filter((c) => c.id !== id));
      setSavedMsg("İndirim kodu silindi");
      setTimeout(() => setSavedMsg(null), 2500);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Silme işlemi başarısız.";
      setErrorToast(msg);
      setTimeout(() => setErrorToast(null), 3000);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-800">İndirim Kodları</h1>
          <p className="mt-1 text-sm text-neutral-500">{codes.length} kod</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          + Yeni Kod
        </button>
      </div>

      <div className="border border-neutral-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-950" />
          </div>
        ) : codes.length === 0 ? (
          <p className="py-20 text-center text-sm text-neutral-400">Henüz indirim kodu yok.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-neutral-600">Kod</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-neutral-600">Değer</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-neutral-600 hidden sm:table-cell">Kullanım</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-neutral-600 hidden md:table-cell">Son Kullanım</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-neutral-600">Durum</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {codes.map((d) => {
                const status = statusOf(d);
                return (
                  <tr key={d.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-sm font-medium text-neutral-950">{d.code}</span>
                    </td>
                    <td className="px-5 py-3.5 text-neutral-700">
                      {d.type === "PERCENTAGE" ? `%${d.value}` : formatPrice(d.value, "TRY")}
                    </td>
                    <td className="px-5 py-3.5 text-neutral-700 hidden sm:table-cell">
                      {d.usageCount}{d.usageLimit !== null ? ` / ${d.usageLimit}` : ""}
                    </td>
                    <td className="px-5 py-3.5 text-neutral-700 hidden md:table-cell">
                      {d.expiresAt
                        ? new Date(d.expiresAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {confirmDeleteId === d.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleDelete(d.id)}
                            disabled={deletingId === d.id}
                            className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            Sil
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:border-neutral-400"
                          >
                            Vazgeç
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(d)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-950"
                          >
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Düzenle
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(d.id)}
                            className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                          >
                            Sil
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
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
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-base font-semibold text-neutral-950">
                {formMode === "create" ? "Yeni İndirim Kodu" : "İndirim Kodunu Düzenle"}
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

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Kod *</label>
                <div className="flex gap-2">
                  <input
                    ref={firstInputRef}
                    type="text"
                    value={form.code}
                    disabled={formMode !== "create"}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="YAZ2026"
                    className={`${inputCls} font-mono uppercase disabled:cursor-not-allowed disabled:opacity-60`}
                  />
                  {formMode === "create" && (
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={generating}
                      className="shrink-0 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950 disabled:opacity-50"
                    >
                      {generating ? "..." : "Kod Oluştur"}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Tip *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as DiscountType }))}
                    className={inputCls}
                  >
                    <option value="PERCENTAGE">Yüzde (%)</option>
                    <option value="FIXED">Sabit Tutar (₺)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">
                    Değer * {form.type === "PERCENTAGE" ? "(%)" : "(₺)"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={form.type === "PERCENTAGE" ? 100 : undefined}
                    value={form.value}
                    onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                    placeholder={form.type === "PERCENTAGE" ? "20" : "50"}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Kullanım Limiti</label>
                  <input
                    type="number"
                    min="1"
                    value={form.usageLimit}
                    onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
                    placeholder="Sınırsız"
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Min. Sepet (₺)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.minOrderKurus}
                    onChange={(e) => setForm((f) => ({ ...f, minOrderKurus: e.target.value }))}
                    placeholder="Yok"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Son Kullanım Tarihi</label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Durum</label>
                  <label className="flex cursor-pointer items-center gap-2 pt-2.5">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                      className="h-4 w-4 accent-neutral-950"
                    />
                    <span className="text-sm text-neutral-700">Aktif</span>
                  </label>
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>

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
