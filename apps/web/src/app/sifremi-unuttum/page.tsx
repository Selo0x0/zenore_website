"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiUrl } from "@/lib/api";
import { getSafeRedirectPath } from "@/lib/safe-redirect";

export default function SifremiUnuttumPage() {
  return (
    <Suspense fallback={null}>
      <SifremiUnuttumForm />
    </Suspense>
  );
}

function SifremiUnuttumForm() {
  const searchParams = useSearchParams();
  const redirect = getSafeRedirectPath(searchParams.get("redirect"), "/");

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    try {
      const continueUrl = `${window.location.origin}/giris${
        redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""
      }`;
      const res = await fetch(`${apiUrl}/auth/password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), continueUrl }),
      });

      if (!res.ok) throw new Error("password-reset-failed");

      setMessage("Bu e-posta ile kayıtlı bir hesap varsa, şifre sıfırlama bağlantısı gönderildi.");
    } catch {
      setError("Şifre sıfırlama e-postası gönderilemedi. Lütfen e-posta adresinizi kontrol edin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-2xl tracking-tight text-ink">
            Şifremi Unuttum
          </h1>
          <p className="mt-2 text-sm leading-6 text-brown-muted">
            E-posta adresinizi girin. Kayıtlı bir hesap varsa şifre yenileme bağlantısı gönderilir.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-brown">
              E-posta
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 border border-brown-muted/30 bg-cream-soft px-3 text-sm text-ink outline-none focus:border-rust"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="h-11 bg-rust text-sm font-semibold text-cream transition hover:bg-rust-dark disabled:cursor-not-allowed disabled:bg-brown-muted/40"
          >
            {loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-brown-muted">
          Şifrenizi hatırladınız mı?{" "}
          <Link
            href={`/giris${redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
            className="font-medium text-rust-dark underline underline-offset-2"
          >
            Giriş yap
          </Link>
        </p>
      </div>
    </main>
  );
}
