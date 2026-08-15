import type { ReactNode } from "react";

export function LegalPage({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <section className="border-b border-brown-muted/15 bg-cream-soft">
        <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8 lg:py-20">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-brown-muted">
            Zenore
          </p>
          <h1 className="font-serif text-3xl tracking-tight text-ink sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 text-sm text-brown-muted">Son güncelleme: {updatedAt}</p>
        </div>
      </section>
      <section className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 lg:py-16">
        <div className="flex flex-col gap-8 text-sm leading-7 text-brown [&_h2]:mb-2 [&_h2]:font-serif [&_h2]:text-xl [&_h2]:text-ink [&_a]:text-rust-dark [&_a]:underline [&_strong]:text-ink">
          {children}
        </div>
      </section>
    </main>
  );
}
