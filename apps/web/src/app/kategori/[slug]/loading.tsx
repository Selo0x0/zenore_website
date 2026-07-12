export default function Loading() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-10 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-3 border-b border-neutral-200 pb-8">
          <div className="h-4 w-16 animate-pulse rounded bg-neutral-100" />
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="h-10 w-64 animate-pulse rounded bg-neutral-100" />
            <div className="h-4 w-20 animate-pulse rounded bg-neutral-100" />
          </div>
        </header>

        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col">
              <div className="aspect-[4/3] animate-pulse bg-stone-100" />
              <div className="mt-3 flex flex-col gap-1.5">
                <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-100" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-neutral-100" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
