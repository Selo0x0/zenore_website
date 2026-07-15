import type { Metadata } from "next";
import { ContactForm } from "./contact-form";
import { internalApiUrl } from "../products/product-data";

export const metadata: Metadata = {
  title: "İletişim | Zenore",
  description: "Zenore ile iletişime geçin.",
};

type ContactContent = {
  email: string;
  phone: string;
  address: string;
  hours: string;
  instagram: string;
  whatsapp: string;
};

async function getContact(): Promise<ContactContent> {
  try {
    const res = await fetch(`${internalApiUrl}/site-content/contact`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error();
    return res.json() as Promise<ContactContent>;
  } catch {
    return {
      email: "info@zenore.com",
      phone: "+90 532 123 45 67",
      address: "Kapalıçarşı, Beyazıt, İstanbul",
      hours: "Hafta içi 09:00 – 18:00",
      instagram: "zenore_leather",
      whatsapp: "+905321234567",
    };
  }
}

export default async function IletisimPage() {
  const contact = await getContact();

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      {/* Header */}
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Zenore
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">İletişim</h1>
          <p className="mt-4 text-neutral-500">
            Bir sorunuz mu var? Size yardımcı olmaktan memnuniyet duyarız.
          </p>
        </div>
      </section>

      {/* Form + Info */}
      <section className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_380px] lg:gap-16 lg:px-10 lg:py-20">
        <ContactForm />

        {/* Contact info */}
        <div className="flex flex-col gap-8">
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-neutral-400">
              İletişim Bilgileri
            </h2>
            <ul className="flex flex-col gap-4">
              <li className="flex items-start gap-3">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                </svg>
                <a href={`mailto:${contact.email}`} className="text-sm text-neutral-700 hover:text-neutral-950 transition">
                  {contact.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="text-sm text-neutral-700 hover:text-neutral-950 transition">
                  {contact.phone}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                <span className="text-sm text-neutral-700">{contact.address}</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="text-sm text-neutral-700">{contact.hours}</span>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-neutral-400">
              Sosyal Medya
            </h2>
            <div className="flex gap-3">
              <a
                href={`https://instagram.com/${contact.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded border border-neutral-200 bg-white px-4 py-2.5 text-xs font-medium text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                @{contact.instagram}
              </a>
              <a
                href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded border border-neutral-200 bg-white px-4 py-2.5 text-xs font-medium text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.564 4.14 1.546 5.872L0 24l6.285-1.512A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.015-1.378l-.36-.213-3.727.896.943-3.618-.234-.372A9.818 9.818 0 0 1 2.182 12C2.182 6.58 6.58 2.182 12 2.182S21.818 6.58 21.818 12 17.42 21.818 12 21.818z" />
                </svg>
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
