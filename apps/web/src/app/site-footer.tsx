import Link from "next/link";
import Image from "next/image";

const LEGAL_LINKS = [
  { href: "/gizlilik-politikasi", label: "Gizlilik Politikası" },
  { href: "/mesafeli-satis-sozlesmesi", label: "Mesafeli Satış Sözleşmesi" },
  { href: "/iade-ve-degisim-politikasi", label: "İade ve Değişim Politikası" },
  { href: "/kvkk-aydinlatma-metni", label: "KVKK Aydınlatma Metni" },
  { href: "/cerez-politikasi", label: "Çerez Politikası" },
  { href: "/kullanim-kosullari", label: "Kullanım Koşulları" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-brown-muted/15 bg-cream-soft">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 sm:grid-cols-3 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-ink"
          >
            <Image src="/zenore-mark.png" alt="" width={32} height={32} className="h-8 w-8" />
            Zenore
          </Link>
          <p className="text-sm leading-6 text-brown-muted">
            Günlük kullanım için özenle üretilmiş hakiki deri ürünler.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-brown-muted">
            Kurumsal
          </h3>
          <Link href="/hakkimizda" className="text-sm text-brown transition hover:text-rust-dark">
            Hakkımızda
          </Link>
          <Link href="/iletisim" className="text-sm text-brown transition hover:text-rust-dark">
            İletişim
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-brown-muted">
            Yasal
          </h3>
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-brown transition hover:text-rust-dark"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="border-t border-brown-muted/15">
        <div className="mx-auto w-full max-w-6xl px-5 py-6 text-xs text-brown-muted sm:px-8 lg:px-10">
          <p>© {new Date().getFullYear()} Zenore. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  );
}
