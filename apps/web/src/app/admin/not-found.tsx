import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-5 text-neutral-950">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
          Zenore Admin
        </p>
        <div className="flex flex-col gap-3">
          <h1 className="text-6xl font-bold tracking-tight">404</h1>
          <p className="text-xl font-semibold">Sayfa bulunamadı</p>
          <p className="text-sm leading-6 text-neutral-500">
            Aradığınız admin sayfası taşınmış, silinmiş ya da hiç var olmamış olabilir.
          </p>
        </div>
        <Link
          href="/admin"
          className="bg-neutral-950 px-7 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          Panele Dön
        </Link>
      </div>
    </div>
  );
}
