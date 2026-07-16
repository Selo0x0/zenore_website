import Image from "next/image";

export function HomeHero() {
  return (
    <section className="relative overflow-hidden bg-[#3E3B28] text-white">
      <Image
        src="/hero_image.jpeg"
        alt="Hakiki deri Zenore ürünleri — çanta, cüzdan, kartlık ve kemer"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[80%_center]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/10" />
      <div className="relative mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-300">
          Zenore
        </p>
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
          Hakiki deri. Nesilden nesile.
        </h1>
        <p className="mt-6 max-w-md text-base leading-7 text-neutral-300 sm:text-lg">
          Her parça elle işlenir, birinci sınıf ham deriden üretilir ve yıllarca yanınızda kalacak şekilde tasarlanır.
        </p>
        <a
          href="#koleksiyon"
          className="mt-9 inline-flex items-center gap-2 bg-white px-7 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200"
        >
          Koleksiyonu Keşfet
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
          </svg>
        </a>
      </div>
    </section>
  );
}
