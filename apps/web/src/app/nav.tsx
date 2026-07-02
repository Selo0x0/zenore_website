"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavChild = { label: string; href: string };
type NavItem =
  | { label: string; href: string; children?: never }
  | { label: string; href?: never; children: NavChild[] };

const navItems: NavItem[] = [
  { label: "Ana Sayfa", href: "/" },
  { label: "Cüzdan", href: "/kategori/cuzdan" },
  { label: "Çanta", href: "/kategori/canta" },
  {
    label: "Ofis Malzemeleri",
    children: [
      { label: "Deri Kalemlik", href: "/kategori/deri-kalemlik" },
      { label: "Mouse Pad", href: "/kategori/mouse-pad" },
      { label: "Masa Matı", href: "/kategori/masa-mati" },
    ],
  },
  { label: "Saat Kordonu", href: "/kategori/saat-kordonu" },
  {
    label: "Aksesuar",
    children: [
      { label: "Deri Saat Kutusu", href: "/kategori/deri-saat-kutusu" },
      { label: "Gözlük Kılıfı", href: "/kategori/gozluk-kilifi" },
    ],
  },
  {
    label: "Apple Aksesuar",
    children: [
      { label: "Apple Watch Kordonu", href: "/kategori/apple-watch-kordonu" },
      { label: "iPhone Kılıf", href: "/kategori/iphone-kilif" },
      { label: "MacBook Kılıf", href: "/kategori/macbook-kilif" },
      { label: "AirPods Kılıf", href: "/kategori/airpods-kilif" },
    ],
  },
  { label: "Peç", href: "/kategori/pec" },
  { label: "Hakkımızda", href: "/hakkimizda" },
  { label: "İletişim", href: "/iletisim" },
];

export function MainNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  function toggleDropdown(label: string) {
    setOpenDropdown((prev) => (prev === label ? null : label));
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  function isParentActive(children: NavChild[]) {
    return children.some((child) => isActive(child.href));
  }

  return (
    <nav className="border-t border-neutral-100 bg-white">
      <div className="mx-auto flex h-11 w-full max-w-6xl items-center justify-between px-5 sm:px-8 lg:px-10">
        {/* Desktop nav */}
        <ul className="hidden items-center gap-6 lg:flex">
          {navItems.map((item) => {
            if (item.children) {
              const active = isParentActive(item.children);
              return (
                <li key={item.label} className="group relative">
                  <button
                    type="button"
                    onClick={() => toggleDropdown(item.label)}
                    className={`flex items-center gap-1 text-xs font-medium uppercase tracking-wider transition ${
                      active
                        ? "text-neutral-950"
                        : "text-neutral-500 hover:text-neutral-950"
                    }`}
                  >
                    {item.label}
                    <svg
                      className="h-3 w-3"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M2 4l4 4 4-4" />
                    </svg>
                  </button>
                  <ul
                    className={`absolute left-0 top-full z-50 mt-1 min-w-44 border border-neutral-200 bg-white py-1 shadow-lg transition-all ${
                      openDropdown === item.label
                        ? "visible opacity-100"
                        : "invisible opacity-0"
                    }`}
                  >
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          onClick={() => setOpenDropdown(null)}
                          className={`block px-4 py-2 text-xs font-medium uppercase tracking-wider transition ${
                            isActive(child.href)
                              ? "bg-neutral-50 text-neutral-950"
                              : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-950"
                          }`}
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            }

            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={`text-xs font-medium uppercase tracking-wider transition ${
                    isActive(item.href)
                      ? "text-neutral-950 underline underline-offset-4"
                      : "text-neutral-500 hover:text-neutral-950"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="flex flex-col gap-1.5 lg:hidden"
          aria-label="Menüyü aç"
        >
          <span
            className={`block h-px w-6 bg-neutral-950 transition-transform ${mobileOpen ? "translate-y-2 rotate-45" : ""}`}
          />
          <span
            className={`block h-px w-6 bg-neutral-950 transition-opacity ${mobileOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block h-px w-6 bg-neutral-950 transition-transform ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-neutral-100 bg-white lg:hidden">
          <ul className="mx-auto max-w-6xl divide-y divide-neutral-100 px-5 sm:px-8">
            {navItems.map((item) => {
              if (item.children) {
                return (
                  <li key={item.label}>
                    <button
                      type="button"
                      onClick={() => toggleDropdown(item.label)}
                      className="flex w-full items-center justify-between py-3 text-xs font-medium uppercase tracking-wider text-neutral-700"
                    >
                      {item.label}
                      <svg
                        className={`h-3 w-3 transition-transform ${openDropdown === item.label ? "rotate-180" : ""}`}
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M2 4l4 4 4-4" />
                      </svg>
                    </button>
                    {openDropdown === item.label && (
                      <ul className="mb-2 ml-3 flex flex-col gap-2">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              onClick={() => setMobileOpen(false)}
                              className="block py-1 text-xs font-medium uppercase tracking-wider text-neutral-500 hover:text-neutral-950"
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              }

              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="block py-3 text-xs font-medium uppercase tracking-wider text-neutral-700 hover:text-neutral-950"
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </nav>
  );
}
