"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

type ContactContent = {
  phone?: string;
  whatsapp?: string;
};

function toWhatsAppHref(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = `90${digits.slice(1)}`;
  if (digits.startsWith("5") && digits.length === 10) digits = `90${digits}`;
  if (digits.length < 10) return null;
  return `https://wa.me/${digits}`;
}

export function WhatsAppFloatingButton() {
  const [whatsapp, setWhatsapp] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    apiFetch<ContactContent>("/site-content/contact")
      .then((contact) => {
        if (mounted) setWhatsapp(contact.whatsapp?.trim() || contact.phone?.trim() || null);
      })
      .catch(() => {
        if (mounted) setWhatsapp(null);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const href = useMemo(() => (whatsapp ? toWhatsAppHref(whatsapp) : null), [whatsapp]);

  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp ile iletişime geç"
      title="WhatsApp ile iletişime geç"
      className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_30px_rgba(31,19,10,0.18)] transition hover:-translate-y-0.5 hover:bg-[#1fb85a] focus:outline-none focus:ring-2 focus:ring-rust focus:ring-offset-2 focus:ring-offset-cream sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))] sm:right-6 sm:h-14 sm:w-14"
    >
      <svg
        className="h-6 w-6 sm:h-7 sm:w-7"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35Z" />
        <path d="M12.03 2A9.94 9.94 0 0 0 2.1 11.94c0 1.75.46 3.46 1.34 4.97L2 22.25l5.47-1.43a9.93 9.93 0 0 0 4.56 1.11h.01A9.94 9.94 0 0 0 12.03 2Zm0 18.25h-.01a8.22 8.22 0 0 1-4.2-1.15l-.3-.18-3.25.85.87-3.17-.2-.33a8.21 8.21 0 1 1 7.09 3.98Z" />
      </svg>
    </a>
  );
}
