export default function Loading() {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <div className="mx-auto w-full max-w-6xl px-5 pt-8 sm:px-8 lg:px-10">
        <div className="h-4 w-16 animate-pulse rounded bg-cream-soft" />
      </div>
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-6 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:px-10">
        <div className="aspect-square animate-pulse bg-cream-soft" />

        <div className="flex flex-col gap-6">
          <div>
            <div className="h-3 w-16 animate-pulse rounded bg-cream-soft" />
            <div className="mt-3 h-9 w-3/4 animate-pulse rounded bg-cream-soft" />
            <div className="mt-4 h-7 w-24 animate-pulse rounded bg-cream-soft" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-3 w-full animate-pulse rounded bg-cream-soft" />
            <div className="h-3 w-full animate-pulse rounded bg-cream-soft" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-cream-soft" />
          </div>
          <div className="h-12 w-full animate-pulse rounded bg-cream-soft" />
        </div>
      </section>
    </main>
  );
}
