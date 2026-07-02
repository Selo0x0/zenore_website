"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { apiUrl } from "@/app/products/product-data";

export default function KayitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);

      await updateProfile(credential.user, { displayName });

      const token = await credential.user.getIdToken();

      await fetch(`${apiUrl}/customers/me`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ displayName }),
      });

      router.push(redirect);
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

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">
            Hesap Oluştur
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Zenore&apos;a üye ol ve alışverişe başla.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="displayName" className="text-sm font-medium text-neutral-700">
              Ad Soyad
            </label>
            <input
              id="displayName"
              type="text"
              autoComplete="name"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="h-11 border border-neutral-300 bg-white px-3 text-sm text-neutral-950 outline-none focus:border-neutral-950"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-neutral-700">
              E-posta
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 border border-neutral-300 bg-white px-3 text-sm text-neutral-950 outline-none focus:border-neutral-950"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-neutral-700">
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
              className="h-11 border border-neutral-300 bg-white px-3 text-sm text-neutral-950 outline-none focus:border-neutral-950"
            />
            <p className="text-xs text-neutral-400">En az 6 karakter</p>
          </div>

          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="h-11 bg-neutral-950 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {loading ? "Hesap oluşturuluyor..." : "Kayıt Ol"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Zaten hesabın var mı?{" "}
          <Link
            href={`/giris${redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
            className="font-medium text-neutral-950 underline underline-offset-2"
          >
            Giriş yap
          </Link>
        </p>
      </div>
    </main>
  );
}
