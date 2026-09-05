"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getSafeRedirectPath } from "@/lib/safe-redirect";

type ResetState = "checking" | "ready" | "saving" | "success" | "invalid";

export default function AuthActionPage() {
  return (
    <Suspense fallback={null}>
      <AuthActionContent />
    </Suspense>
  );
}

function AuthActionContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");
  const continueUrl = getSafeRedirectPath(
    searchParams.get("continueUrl"),
    "/giris",
  );

  const [state, setState] = useState<ResetState>("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const hasValidResetParams = mode === "resetPassword" && !!oobCode;

  useEffect(() => {
    if (!hasValidResetParams) return;

    verifyPasswordResetCode(auth, oobCode)
      .then((accountEmail) => {
        setEmail(accountEmail);
        setState("ready");
      })
      .catch(() => setState("invalid"));
  }, [hasValidResetParams, oobCode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!oobCode || password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    setError(null);
    setState("saving");

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setState("success");
    } catch {
      setState("ready");
      setError("Şifre güncellenemedi. Bağlantının süresi dolmuş olabilir.");
    }
  }

  if (state === "checking") {
    return (
      <AuthFrame
        title="Bağlantı Kontrol Ediliyor"
        description="Şifre sıfırlama bağlantınızı doğruluyoruz."
      >
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brown-muted/20 border-t-rust" />
      </AuthFrame>
    );
  }

  if (!hasValidResetParams || state === "invalid") {
    return (
      <AuthFrame
        title="Bağlantı Geçersiz"
        description="Bu şifre sıfırlama bağlantısı geçersiz ya da süresi dolmuş görünüyor."
      >
        <Link
          href="/sifremi-unuttum"
          className="flex h-11 items-center justify-center bg-rust px-5 text-sm font-semibold text-cream transition hover:bg-rust-dark"
        >
          Yeni Bağlantı İste
        </Link>
      </AuthFrame>
    );
  }

  if (state === "success") {
    return (
      <AuthFrame
        title="Şifreniz Güncellendi"
        description="Yeni şifrenizle Zenore hesabınıza giriş yapabilirsiniz."
      >
        <Link
          href={continueUrl}
          className="flex h-11 items-center justify-center bg-rust px-5 text-sm font-semibold text-cream transition hover:bg-rust-dark"
        >
          Giriş Yap
        </Link>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      title="Yeni Şifre Belirle"
      description={email ? `${email} hesabınız için yeni şifrenizi oluşturun.` : "Yeni şifrenizi oluşturun."}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-brown">
            Yeni Şifre
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

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={state === "saving"}
          className="h-11 bg-rust text-sm font-semibold text-cream transition hover:bg-rust-dark disabled:cursor-not-allowed disabled:bg-brown-muted/40"
        >
          {state === "saving" ? "Kaydediliyor..." : "Şifreyi Güncelle"}
        </button>
      </form>
    </AuthFrame>
  );
}

function AuthFrame({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-rust-dark">
            Zenore
          </p>
          <h1 className="font-serif text-2xl tracking-tight text-ink">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-brown-muted">{description}</p>
        </div>
        {children}
      </div>
    </main>
  );
}
