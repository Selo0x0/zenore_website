"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";

type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

type AdminReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  isVerified: boolean;
  status: ReviewStatus;
  createdAt: string;
  product: { name: string; slug: string };
  customer: { displayName: string | null; email: string };
};

const tabs: { value: "ALL" | ReviewStatus; label: string }[] = [
  { value: "PENDING", label: "Bekliyor" },
  { value: "APPROVED", label: "Onaylandı" },
  { value: "REJECTED", label: "Reddedildi" },
  { value: "ALL", label: "Tümü" },
];

function statusBadge(status: ReviewStatus) {
  if (status === "APPROVED") return { label: "Onaylandı", className: "bg-emerald-50 text-emerald-700" };
  if (status === "REJECTED") return { label: "Reddedildi", className: "bg-red-50 text-red-600" };
  return { label: "Bekliyor", className: "bg-amber-50 text-amber-700" };
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5 text-amber-500">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} className="h-3.5 w-3.5" viewBox="0 0 24 24" fill={n <= value ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export default function AdminYorumlarPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"ALL" | ReviewStatus>("PENDING");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function load() {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const qs = tab === "ALL" ? "" : `?status=${tab}`;
      const data = await apiFetch<AdminReview[]>(`/admin/reviews${qs}`, token);
      setReviews(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    // load() eventually calls setState after its awaits
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tab]);

  async function updateStatus(id: string, status: ReviewStatus) {
    if (!user) return;
    setBusyId(id);
    try {
      const token = await user.getIdToken();
      await apiFetch(`/admin/reviews/${id}`, token, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r)).filter((r) => tab === "ALL" || r.status === tab),
      );
      setToast(status === "APPROVED" ? "Yorum onaylandı" : "Yorum reddedildi");
      setTimeout(() => setToast(null), 2500);
    } catch {
      setToast("İşlem başarısız oldu.");
      setTimeout(() => setToast(null), 2500);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!user) return;
    setBusyId(id);
    try {
      const token = await user.getIdToken();
      await apiFetch(`/admin/reviews/${id}`, token, { method: "DELETE" });
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setToast("Yorum silindi");
      setTimeout(() => setToast(null), 2500);
    } catch {
      setToast("Silme işlemi başarısız.");
      setTimeout(() => setToast(null), 2500);
    } finally {
      setBusyId(null);
      setConfirmDeleteId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-800">Yorumlar</h1>
        <p className="mt-1 text-sm text-neutral-500">Ürün değerlendirmelerini onaylayın veya reddedin.</p>
      </div>

      <div className="flex gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              tab === t.value
                ? "bg-neutral-950 text-white"
                : "border border-neutral-200 text-neutral-600 hover:border-neutral-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="border border-neutral-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-950" />
          </div>
        ) : reviews.length === 0 ? (
          <p className="py-20 text-center text-sm text-neutral-400">Bu filtrede yorum yok.</p>
        ) : (
          <div className="flex flex-col divide-y divide-neutral-100">
            {reviews.map((review) => {
              const badge = statusBadge(review.status);
              return (
                <div key={review.id} className="flex flex-col gap-3 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Stars value={review.rating} />
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                      {review.isVerified && (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          Doğrulanmış Alıcı
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-neutral-400">
                      {new Date(review.createdAt).toLocaleDateString("tr-TR")}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-neutral-500">
                      {review.product.name} · {review.customer.displayName ?? review.customer.email}
                    </p>
                    {review.title && <p className="mt-1 font-semibold text-neutral-900">{review.title}</p>}
                    <p className="mt-1 text-sm leading-6 text-neutral-600">{review.body}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {review.status !== "APPROVED" && (
                      <button
                        type="button"
                        disabled={busyId === review.id}
                        onClick={() => updateStatus(review.id, "APPROVED")}
                        className="rounded-md border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                      >
                        Onayla
                      </button>
                    )}
                    {review.status !== "REJECTED" && (
                      <button
                        type="button"
                        disabled={busyId === review.id}
                        onClick={() => updateStatus(review.id, "REJECTED")}
                        className="rounded-md border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-50 disabled:opacity-50"
                      >
                        Reddet
                      </button>
                    )}
                    {confirmDeleteId === review.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={busyId === review.id}
                          onClick={() => handleDelete(review.id)}
                          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          Sil
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:border-neutral-400"
                        >
                          Vazgeç
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(review.id)}
                        className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                      >
                        Sil
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 shadow-2xl ring-1 ring-white/5">
          <span className="text-sm font-medium text-white">{toast}</span>
        </div>
      )}
    </div>
  );
}
