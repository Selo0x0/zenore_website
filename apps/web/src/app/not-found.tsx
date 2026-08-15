import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream px-5 text-ink">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brown-muted">
          Zenore
        </p>
        <div className="flex flex-col gap-3">
          <h1 className="font-serif text-6xl tracking-tight text-ink">404</h1>
          <p className="text-xl font-semibold text-ink">Sayfa bulunamadı</p>
          <p className="text-sm leading-6 text-brown-muted">
            Aradığınız sayfa taşınmış, silinmiş ya da hiç var olmamış olabilir.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="bg-rust px-7 py-3 text-sm font-medium text-cream transition hover:bg-rust-dark"
          >
            Ana Sayfaya Dön
          </Link>
          <Link
            href="/kategori/cuzdan"
            className="border border-brown-muted/20 bg-cream-soft px-7 py-3 text-sm font-medium text-ink transition hover:border-rust-dark"
          >
            Ürünleri İncele
          </Link>
        </div>
      </div>
    </main>
  );
}
