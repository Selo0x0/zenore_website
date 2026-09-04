"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";
import { formatPrice } from "@/app/products/product-data";
import { AdminToast } from "../admin-toast";

type ShippingSettings = {
  feeKurus: number;
  freeShippingThresholdKurus: number;
  isActive: boolean;
};

const defaultForm = {
  feeTry: "150",
  freeShippingThresholdTry: "2000",
  isActive: true,
};

export default function AdminKargoPage() {
  const { user } = useAuth();
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const settings = await apiFetch<ShippingSettings>("/admin/shipping-settings", token);
        setForm({
          feeTry: String(settings.feeKurus / 100),
          freeShippingThresholdTry: String(settings.freeShippingThresholdKurus / 100),
          isActive: settings.isActive,
        });
      } catch {
        setToast({ message: "Kargo ayarları yüklenemedi.", type: "error" });
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const settings = await apiFetch<ShippingSettings>("/admin/shipping-settings", token, {
        method: "PUT",
        body: JSON.stringify({
          feeKurus: Math.round(parseFloat(form.feeTry) * 100),
          freeShippingThresholdKurus: Math.round(parseFloat(form.freeShippingThresholdTry) * 100),
          isActive: form.isActive,
        }),
      });
      setForm({
        feeTry: String(settings.feeKurus / 100),
        freeShippingThresholdTry: String(settings.freeShippingThresholdKurus / 100),
        isActive: settings.isActive,
      });
      setToast({ message: "Kargo ayarları güncellendi", type: "success" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Kargo ayarları kaydedilemedi.";
      setToast({ message, type: "error" });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  }

  const feeKurus = Math.round((parseFloat(form.feeTry) || 0) * 100);
  const thresholdKurus = Math.round((parseFloat(form.freeShippingThresholdTry) || 0) * 100);
  const canSave = Number.isFinite(feeKurus) && Number.isFinite(thresholdKurus);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="font-serif text-2xl tracking-tight text-ink">Kargo Yönetimi</h1>
        <p className="mt-1 text-sm text-brown-muted">
          Checkout ve sipariş toplamlarında kullanılan kargo ücretini yönetin.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center border border-brown-muted/15 bg-cream-soft py-20">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-brown-muted/15 border-t-rust" />
        </div>
      ) : (
        <section className="border border-brown-muted/15 bg-cream-soft p-5 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-brown-muted">
                  Kargo Ücreti (₺)
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.feeTry}
                  onChange={(e) => setForm((current) => ({ ...current, feeTry: e.target.value }))}
                  className={inputCls}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-brown-muted">
                  Ücretsiz Kargo Limiti (₺)
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.freeShippingThresholdTry}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      freeShippingThresholdTry: e.target.value,
                    }))
                  }
                  className={inputCls}
                />
              </label>

              <label className="flex cursor-pointer items-center gap-3 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((current) => ({ ...current, isActive: e.target.checked }))}
                  className="h-4 w-4 accent-neutral-950"
                />
                <span className="text-sm text-brown">Kargo ücretlendirmesi aktif</span>
              </label>
            </div>

            <div className="border border-brown-muted/15 bg-cream p-5">
              <h2 className="font-serif text-lg text-ink">Önizleme</h2>
              <div className="mt-4 flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-brown-muted">Kargo ücreti</span>
                  <span className="font-medium text-ink">{formatPrice(feeKurus, "TRY")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brown-muted">Ücretsiz limit</span>
                  <span className="font-medium text-ink">{formatPrice(thresholdKurus, "TRY")}</span>
                </div>
                <div className="flex justify-between border-t border-brown-muted/15 pt-3">
                  <span className="text-brown-muted">Durum</span>
                  <span className={form.isActive ? "font-medium text-emerald-700" : "font-medium text-brown-muted"}>
                    {form.isActive ? "Aktif" : "Pasif"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end border-t border-brown-muted/10 pt-5">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !canSave}
              className="h-11 bg-rust px-6 text-sm font-medium text-cream transition hover:bg-rust-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </section>
      )}

      {toast && <AdminToast message={toast.message} type={toast.type} />}
    </div>
  );
}

const inputCls =
  "w-full border border-brown-muted/15 bg-cream px-3 py-2 text-sm text-ink outline-none transition focus:border-rust focus:bg-cream-soft";
