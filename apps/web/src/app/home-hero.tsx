import Image from "next/image";

export function HomeHero() {
  return (
    <section className="overflow-hidden bg-cream sm:relative sm:min-h-[600px] lg:min-h-[680px]">
      {/* Mobile: image sits in normal flow with a fixed aspect ratio, text
          flows below on plain background — no overlay needed.
          sm:+ : image fills the section as a background and the text
          overlays it with a gradient, since there's enough width for both
          to coexist legibly. */}
      <div className="relative aspect-[4/3] w-full sm:absolute sm:inset-0 sm:aspect-auto">
        <Image
          src="/hero_image.jpeg"
          alt="Hakiki deri Zenore ürünleri — çanta, cüzdan, kartlık ve kemer"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[80%_35%]"
        />
        <div className="absolute inset-0 hidden sm:block sm:bg-[linear-gradient(to_right,rgba(247,239,230,0.8)_0%,rgba(247,239,230,0.78)_40%,rgba(247,239,230,0)_58%)]" />
      </div>
      <div className="relative mx-auto flex flex-col items-start px-5 py-10 sm:h-full sm:max-w-6xl sm:justify-center sm:px-8 sm:py-20 lg:px-10">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-rust-dark">
          Hakiki deri. Zamansız şıklık.
        </p>
        <h1 className="max-w-2xl font-serif text-4xl leading-tight tracking-tight text-ink sm:text-6xl font-medium!">
          Nesilden nesile değer katan detaylar.
        </h1>
        <p className="mt-6 max-w-md text-base leading-7 text-brown sm:text-lg">
          Usta işçilikle üretilen hakiki deri ürünlerimiz, günlük hayatınıza estetik ve dayanıklılığı bir arada sunar.
        </p>
        <a
          href="#koleksiyon"
          className="mt-9 inline-flex items-center gap-2 bg-rust px-7 py-3 text-sm font-semibold uppercase tracking-wide text-cream transition hover:bg-rust-dark"
        >
          Koleksiyonu Keşfet
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </a>
      </div>
    </section>
  );
}
