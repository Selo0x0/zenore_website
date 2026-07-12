"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";
import type { Review } from "../product-data";

function Stars({ value, size = "h-4 w-4" }: { value: number; size?: string }) {
  return (
    <div className="flex gap-0.5 text-amber-500">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          className={size}
          viewBox="0 0 24 24"
          fill={n <= Math.round(value) ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function ReviewForm({
  productId,
  onSubmitted,
}: {
  productId: string;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const { user } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      await apiFetch("/reviews", token, {
        method: "POST",
        body: JSON.stringify({ productId, rating, title: title || undefined, body }),
      });
      setSubmitted(true);
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yorum gönderilemedi.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <p className="border border-dashed border-neutral-300 bg-white p-5 text-sm text-neutral-600">
        Yorumunuz alındı, onaylandıktan sonra bu sayfada görünecektir.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 border border-neutral-200 bg-white p-5">
      <div>
        <p className="mb-2 text-sm font-medium text-neutral-700">Puanınız</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} yıldız`}
              className="text-amber-500"
            >
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill={n <= rating ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="review-title" className="mb-1 block text-sm font-medium text-neutral-700">
          Başlık (opsiyonel)
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-950 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="review-body" className="mb-1 block text-sm font-medium text-neutral-700">
          Yorumunuz
        </label>
        <textarea
          id="review-body"
          required
          minLength={10}
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-950 focus:outline-none"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="self-start bg-neutral-950 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
      >
        {submitting ? "Gönderiliyor..." : "Yorumu Gönder"}
      </button>
    </form>
  );
}

export function ProductReviews({
  productId,
  initialReviews,
  average,
  count,
}: {
  productId: string;
  initialReviews: Review[];
  average: number;
  count: number;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showForm, setShowForm] = useState(false);
  const [formDone, setFormDone] = useState(false);

  function handleWriteReview() {
    if (!user) {
      router.push(`/giris?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    setShowForm(true);
  }

  return (
    <section className="border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-12 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Değerlendirmeler</h2>
            {count > 0 ? (
              <div className="mt-2 flex items-center gap-3">
                <Stars value={average} size="h-5 w-5" />
                <span className="text-sm text-neutral-600">
                  {average.toFixed(1)} · {count} değerlendirme
                </span>
              </div>
            ) : (
              <p className="mt-2 text-sm text-neutral-500">Henüz değerlendirme yok.</p>
            )}
          </div>
          {!showForm && !formDone && !loading && (
            <button
              type="button"
              onClick={handleWriteReview}
              className="self-start border border-neutral-950 px-6 py-2.5 text-sm font-medium text-neutral-950 transition hover:bg-neutral-950 hover:text-white"
            >
              Yorum Yaz
            </button>
          )}
        </div>

        {showForm && !formDone && (
          <ReviewForm productId={productId} onSubmitted={() => setFormDone(true)} />
        )}

        {initialReviews.length > 0 && (
          <div className="flex flex-col gap-5">
            {initialReviews.map((review) => (
              <article key={review.id} className="border border-neutral-200 bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Stars value={review.rating} />
                    {review.isVerified && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        Doğrulanmış Alıcı
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-neutral-400">
                    {new Date(review.createdAt).toLocaleDateString("tr-TR")}
                  </span>
                </div>
                {review.title && (
                  <p className="mt-3 font-semibold text-neutral-900">{review.title}</p>
                )}
                <p className="mt-1 text-sm leading-6 text-neutral-600">{review.body}</p>
                <p className="mt-3 text-xs font-medium text-neutral-400">
                  {review.customer.displayName ?? "Zenore Müşterisi"}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
