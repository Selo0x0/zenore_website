import type { Metadata } from "next";
import Image from "next/image";
import { apiUrl, internalApiUrl } from "../products/product-data";

export const metadata: Metadata = {
  title: "Hakkımızda | Zenore",
  description: "Zenore hakkında — hakiki deri, el işçiliği ve markamızın hikayesi.",
};

type Value = { title: string; description: string };

type AboutContent = {
  hero: string;
  heroSub: string;
  story: string;
  values: Value[];
  imageUrl?: string;
};

function resolveImageUrl(value: string) {
  return value.startsWith("http") ? value : `${apiUrl}/images/products/${value}`;
}

async function getAbout(): Promise<AboutContent | null> {
  try {
    const res = await fetch(`${internalApiUrl}/site-content/about`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error();
    return res.json() as Promise<AboutContent>;
  } catch {
    return null;
  }
}

export default async function HakkimizdaPage() {
  const about = await getAbout();

  if (!about) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center bg-cream text-center text-brown-muted">
        İçerik şu anda yüklenemiyor.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream text-ink">
      {/* Hero */}
      <section className="border-b border-brown-muted/15 bg-cream-soft">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-brown-muted">
            Zenore
          </p>
          <h1 className="max-w-2xl font-serif text-4xl leading-tight tracking-tight text-ink sm:text-5xl lg:text-6xl">
            {about.hero}
          </h1>
          <p className="mt-6 max-w-xl text-lg text-brown-muted">{about.heroSub}</p>
        </div>
      </section>

      {/* Story + Image */}
      <section
        className={`mx-auto grid w-full max-w-6xl gap-12 px-5 py-16 sm:px-8 lg:gap-20 lg:px-10 lg:py-24 ${
          about.imageUrl ? "lg:grid-cols-2" : ""
        }`}
      >
        <div className="flex max-w-2xl flex-col justify-center gap-6">
          <h2 className="font-serif text-2xl tracking-tight text-ink">Hikayemiz</h2>
          <p className="text-base leading-8 text-brown">{about.story}</p>
        </div>
        {about.imageUrl && (
          <div className="relative aspect-[4/3] overflow-hidden bg-cream-soft">
            <Image
              src={resolveImageUrl(about.imageUrl)}
              alt="Zenore atölye"
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
              unoptimized
            />
          </div>
        )}
      </section>

      {/* Values */}
      <section className="border-t border-brown-muted/15 bg-cream-soft">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          <h2 className="mb-12 text-center font-serif text-2xl tracking-tight text-ink">
            Değerlerimiz
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {about.values.map((v) => (
              <div key={v.title} className="flex flex-col gap-3 border border-brown-muted/15 bg-cream p-8">
                <h3 className="text-base font-semibold text-ink">{v.title}</h3>
                <p className="text-sm leading-7 text-brown-muted">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
