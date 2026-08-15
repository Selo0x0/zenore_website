function CardSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="aspect-[4/3] animate-pulse bg-cream-soft" />
      <div className="mt-3 flex flex-col gap-1.5">
        <div className="h-4 w-3/4 animate-pulse rounded bg-cream-soft" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-cream-soft" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 lg:px-10">
      <div className="mb-10 flex items-end justify-between border-b border-brown-muted/15 pb-6">
        <div className="h-8 w-40 animate-pulse rounded bg-cream-soft" />
        <div className="h-4 w-16 animate-pulse rounded bg-cream-soft" />
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-20 shrink-0 animate-pulse rounded-full bg-cream-soft" />
          ))}
        </div>
        <div className="h-8 w-full animate-pulse rounded-full bg-cream-soft sm:w-52" />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}
