"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { signInWithGoogle, syncCustomerProfile } from "@/lib/auth";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { AuthGoogleButton } from "../auth-google-button";

export default function KayitPage() {
  return (
    <Suspense fallback={null}>
      <KayitForm />
    </Suspense>
  );
}

function KayitForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = getSafeRedirectPath(searchParams.get("redirect"), "/");

  const [displayName, setDisplayName] = useState("");
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
      const credential = await createUserWithEmailAndPassword(auth, email, password);

      await updateProfile(credential.user, { displayName });

      await syncCustomerProfile(credential.user, displayName);

      router.push(redirect);
      window.scrollTo(0, 0);
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        err.code === "auth/email-already-in-use"
      ) {
        setError("Bu e-posta adresi zaten kullanılıyor.");
      } else if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        err.code === "auth/weak-password"
      ) {
        setError("Şifre en az 6 karakter olmalıdır.");
      } else {
        setError("Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.");
      }
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
      setError("Google ile kayıt/giriş yapılamadı. Lütfen tekrar deneyin.");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-2xl tracking-tight text-ink">
            Hesap Oluştur
          </h1>
          <p className="mt-2 text-sm text-brown-muted">
            Zenore&apos;a üye ol ve alışverişe başla.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="displayName" className="text-sm font-medium text-brown">
              Ad Soyad
            </label>
            <input
              id="displayName"
              type="text"
              autoComplete="name"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="h-11 border border-brown-muted/30 bg-cream-soft px-3 text-sm text-ink outline-none focus:border-rust"
            />
          </div>

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
            <label htmlFor="password" className="text-sm font-medium text-brown">
              Şifre
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 border border-brown-muted/30 bg-cream-soft px-3 text-sm text-ink outline-none focus:border-rust"
            />
            <p className="text-xs text-brown-muted">En az 6 karakter</p>
          </div>

          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="h-11 bg-rust text-sm font-semibold text-cream transition hover:bg-rust-dark disabled:cursor-not-allowed disabled:bg-brown-muted/40"
          >
            {loading ? "Hesap oluşturuluyor..." : "Kayıt Ol"}
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
          Zaten hesabın var mı?{" "}
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
