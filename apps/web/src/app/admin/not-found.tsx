import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-5 text-ink">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brown-muted">
          Zenore Admin
        </p>
        <div className="flex flex-col gap-3">
          <h1 className="font-serif text-6xl tracking-tight">404</h1>
          <p className="text-xl font-semibold">Sayfa bulunamadı</p>
          <p className="text-sm leading-6 text-brown-muted">
            Aradığınız admin sayfası taşınmış, silinmiş ya da hiç var olmamış olabilir.
          </p>
        </div>
        <Link
          href="/admin"
          className="bg-rust px-7 py-3 text-sm font-medium text-cream transition hover:bg-rust-dark"
        >
          Panele Dön
        </Link>
      </div>
    </div>
  );
}
