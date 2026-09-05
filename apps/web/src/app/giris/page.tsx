"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { signInWithGoogle, syncCustomerProfile } from "@/lib/auth";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { AuthGoogleButton } from "../auth-google-button";

export default function GirisPage() {
  return (
    <Suspense fallback={null}>
      <GirisForm />
    </Suspense>
  );
}

function GirisForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = getSafeRedirectPath(searchParams.get("redirect"), "/");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await syncCustomerProfile(credential.user);

      router.push(redirect);
      window.scrollTo(0, 0);
    } catch {
      setError("E-posta veya şifre hatalı. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setGoogleLoading(true);

    try {
      await signInWithGoogle();
      router.push(redirect);
      window.scrollTo(0, 0);
    } catch {
      setError("Google ile giriş yapılamadı. Lütfen tekrar deneyin.");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-2xl tracking-tight text-ink">
            Giriş Yap
          </h1>
          <p className="mt-2 text-sm text-brown-muted">
            Hesabına giriş yap ve alışverişe devam et.
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

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="password" className="text-sm font-medium text-brown">
                Şifre
              </label>
              <Link
                href={`/sifremi-unuttum${redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
                className="text-xs font-medium text-rust-dark underline underline-offset-2 transition hover:text-ink disabled:cursor-not-allowed disabled:text-brown-muted"
              >
                Şifremi unuttum
              </Link>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 border border-brown-muted/30 bg-cream-soft px-3 text-sm text-ink outline-none focus:border-rust"
            />
          </div>

          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="h-11 bg-rust text-sm font-semibold text-cream transition hover:bg-rust-dark disabled:cursor-not-allowed disabled:bg-brown-muted/40"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-brown-muted/20" />
          <span className="text-xs uppercase tracking-[0.18em] text-brown-muted">veya</span>
          <span className="h-px flex-1 bg-brown-muted/20" />
        </div>

        <AuthGoogleButton
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          loading={googleLoading}
        />

        <p className="mt-6 text-center text-sm text-brown-muted">
          Hesabın yok mu?{" "}
          <Link
            href={`/kayit${redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
            className="font-medium text-rust-dark underline underline-offset-2"
          >
            Kayıt ol
          </Link>
        </p>
      </div>
    </main>
  );
}
