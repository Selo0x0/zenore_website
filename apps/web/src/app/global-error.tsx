"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="tr">
      <body className="min-h-full bg-cream text-ink">
        <main className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
          <div className="flex max-w-md flex-col items-center gap-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brown-muted">
              Zenore
            </p>
            <div className="flex flex-col gap-3">
              <h1 className="font-serif text-6xl tracking-tight text-ink">500</h1>
              <p className="text-xl font-semibold text-ink">Bir hata oluştu</p>
              <p className="text-sm leading-6 text-brown-muted">
                Beklenmedik bir sorun yaşandı. Lütfen tekrar deneyin.
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="bg-rust px-7 py-3 text-sm font-medium text-cream transition hover:bg-rust-dark"
            >
              Tekrar Dene
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
