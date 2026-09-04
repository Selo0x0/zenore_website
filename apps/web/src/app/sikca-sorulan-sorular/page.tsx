import type { Metadata } from "next";
import { internalApiUrl } from "../products/product-data";

export const metadata: Metadata = {
  title: "Sıkça Sorulan Sorular | Zenore",
  description: "Zenore sipariş, kargo, ödeme ve ürün bakımı hakkında sıkça sorulan sorular.",
};

type FaqItem = {
  question: string;
  answer: string;
};

type FaqContent = {
  hero: string;
  heroSub: string;
  items: FaqItem[];
};

const fallbackFaq: FaqContent = {
  hero: "Sıkça Sorulan Sorular",
  heroSub: "Sipariş, kargo, ödeme ve ürün bakımı hakkında en çok merak edilen konular.",
  items: [],
};

function normalizeFaq(value: unknown): FaqContent {
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallbackFaq;
  const data = value as Partial<FaqContent>;

  return {
    hero: typeof data.hero === "string" && data.hero.trim() ? data.hero : fallbackFaq.hero,
    heroSub:
      typeof data.heroSub === "string" && data.heroSub.trim()
        ? data.heroSub
        : fallbackFaq.heroSub,
    items: Array.isArray(data.items)
      ? data.items
          .filter(
            (item): item is FaqItem =>
              !!item &&
              typeof item === "object" &&
              "question" in item &&
              "answer" in item &&
              typeof item.question === "string" &&
              typeof item.answer === "string" &&
              item.question.trim().length > 0 &&
              item.answer.trim().length > 0,
          )
          .map((item) => ({
            question: item.question.trim(),
            answer: item.answer.trim(),
          }))
      : [],
  };
}

async function getFaq(): Promise<FaqContent | null> {
  try {
    const res = await fetch(`${internalApiUrl}/site-content/faq`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error();
    return normalizeFaq(await res.json());
  } catch {
    return null;
  }
}

export default async function SikcaSorulanSorularPage() {
  const faq = await getFaq();

  if (!faq) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center bg-cream text-center text-brown-muted">
        İçerik şu anda yüklenemiyor.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream text-ink">
      <section className="border-b border-brown-muted/15 bg-cream-soft">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-brown-muted">
            Yardım
          </p>
          <h1 className="max-w-2xl font-serif text-4xl leading-tight tracking-tight text-ink sm:text-5xl">
            {faq.hero}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-brown-muted sm:text-lg">
            {faq.heroSub}
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
        {faq.items.length === 0 ? (
          <div className="border border-dashed border-brown-muted/20 bg-cream-soft px-6 py-12 text-center text-sm text-brown-muted">
            Henüz soru eklenmedi.
          </div>
        ) : (
          <div className="divide-y divide-brown-muted/15 border-y border-brown-muted/15">
            {faq.items.map((item) => (
              <details key={item.question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-left">
                  <span className="font-serif text-lg text-ink">{item.question}</span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-brown-muted/20 text-brown-muted transition group-open:rotate-45 group-open:border-rust group-open:text-rust">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-brown">{item.answer}</p>
              </details>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
