import type { Metadata } from "next";
import Image from "next/image";
import { apiUrl } from "../products/product-data";

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
  imageUrl: string;
};

async function getAbout(): Promise<AboutContent> {
  try {
    const res = await fetch(`${apiUrl}/site-content/about`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error();
    return res.json() as Promise<AboutContent>;
  } catch {
    return {
      hero: "Deriyle Başlayan Bir Hikaye",
      heroSub: "2018'den bu yana hakiki deri ile el işçiliğini buluşturuyoruz.",
      story:
        "Zenore, 2018 yılında İstanbul'da küçük bir atölyede kuruldu. Her ürün, yılların tecrübesiyle seçilen ham derilerden, ustalıkla işlenerek hayata geçirilmektedir.",
      values: [
        { title: "El İşçiliği", description: "Her dikiş, her kesim elle yapılır." },
        { title: "Hakiki Deri", description: "Yalnızca birinci sınıf ham deri kullanıyoruz." },
        { title: "Ömür Boyu Kalite", description: "Onlarca yıl size eşlik edecek ürünler." },
      ],
      imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1200&q=80",
    };
  }
}

export default async function HakkimizdaPage() {
  const about = await getAbout();

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      {/* Hero */}
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Zenore
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            {about.hero}
          </h1>
          <p className="mt-6 max-w-xl text-lg text-neutral-500">{about.heroSub}</p>
        </div>
      </section>

      {/* Story + Image */}
      <section className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:px-10 lg:py-24">
        <div className="flex flex-col justify-center gap-6">
          <h2 className="text-2xl font-semibold tracking-tight">Hikayemiz</h2>
          <p className="text-base leading-8 text-neutral-600">{about.story}</p>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
          <Image
            src={about.imageUrl}
            alt="Zenore atölye"
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-neutral-200 bg-white">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          <h2 className="mb-12 text-center text-2xl font-semibold tracking-tight">
            Değerlerimiz
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {about.values.map((v) => (
              <div key={v.title} className="flex flex-col gap-3 border border-neutral-100 bg-neutral-50 p-8">
                <h3 className="text-base font-semibold">{v.title}</h3>
                <p className="text-sm leading-7 text-neutral-500">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
