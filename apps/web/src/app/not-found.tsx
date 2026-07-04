import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-5 text-neutral-950">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-400">
          Zenore
        </p>
        <div className="flex flex-col gap-3">
          <h1 className="text-6xl font-bold tracking-tight">404</h1>
          <p className="text-xl font-semibold">Sayfa bulunamadı</p>
          <p className="text-sm leading-6 text-neutral-500">
            Aradığınız sayfa taşınmış, silinmiş ya da hiç var olmamış olabilir.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="bg-neutral-950 px-7 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Ana Sayfaya Dön
          </Link>
          <Link
            href="/kategori/cuzdan"
            className="border border-neutral-200 bg-white px-7 py-3 text-sm font-medium text-neutral-950 transition hover:border-neutral-950"
          >
            Ürünleri İncele
          </Link>
        </div>
      </div>
    </main>
  );
}
