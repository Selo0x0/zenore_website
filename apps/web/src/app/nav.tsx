"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getCategories, type Category } from "./products/product-data";

const STATIC_ITEMS = [
  { label: "Hakkımızda", href: "/hakkimizda" },
  { label: "İletişim", href: "/iletisim" },
];

export function MainNav() {
  const pathname = usePathname();
  const [categories, setCategories] = useState<Category[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  function toggleDropdown(id: string) {
    setOpenDropdown((prev) => (prev === id ? null : id));
  }

  return (
    <nav className="border-t border-neutral-100 bg-white">
      <div className="mx-auto flex h-11 w-full max-w-6xl items-center justify-between px-5 sm:px-8 lg:px-10">
        {/* Desktop nav */}
        <ul className="hidden items-center gap-6 lg:flex">
          <li>
            <Link
              href="/"
              className={`text-xs font-medium uppercase tracking-wider transition ${
                pathname === "/"
                  ? "text-neutral-950 underline underline-offset-4"
                  : "text-neutral-500 hover:text-neutral-950"
              }`}
            >
              Ana Sayfa
            </Link>
          </li>

          {categories.map((cat) => {
            const hasChildren = cat.children && cat.children.length > 0;
            const active = isActive(`/kategori/${cat.slug}`) ||
              cat.children?.some((c) => isActive(`/kategori/${c.slug}`));

            if (hasChildren) {
              return (
                <li key={cat.id} className="relative" ref={openDropdown === cat.id ? dropdownRef : null}>
                  <button
                    type="button"
                    onClick={() => toggleDropdown(cat.id)}
                    className={`flex items-center gap-1 text-xs font-medium uppercase tracking-wider transition ${
                      active ? "text-neutral-950" : "text-neutral-500 hover:text-neutral-950"
                    }`}
                  >
                    {cat.name}
                    <svg
                      className={`h-3 w-3 transition-transform ${openDropdown === cat.id ? "rotate-180" : ""}`}
                      viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
                    >
                      <path d="M2 4l4 4 4-4" />
                    </svg>
                  </button>
                  {openDropdown === cat.id && (
                    <ul className="absolute left-0 top-full z-50 mt-1 min-w-44 border border-neutral-200 bg-white py-1 shadow-lg">
                      <li>
                        <Link
                          href={`/kategori/${cat.slug}`}
                          onClick={() => setOpenDropdown(null)}
                          className={`block px-4 py-2 text-xs font-medium uppercase tracking-wider transition ${
                            isActive(`/kategori/${cat.slug}`)
                              ? "bg-neutral-50 text-neutral-950"
                              : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-950"
                          }`}
                        >
                          Tümü
                        </Link>
                      </li>
                      {cat.children!.map((child) => (
                        <li key={child.id}>
                          <Link
                            href={`/kategori/${child.slug}`}
                            onClick={() => setOpenDropdown(null)}
                            className={`block px-4 py-2 text-xs font-medium uppercase tracking-wider transition ${
                              isActive(`/kategori/${child.slug}`)
                                ? "bg-neutral-50 text-neutral-950"
                                : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-950"
                            }`}
                          >
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            }

            return (
              <li key={cat.id}>
                <Link
                  href={`/kategori/${cat.slug}`}
                  className={`text-xs font-medium uppercase tracking-wider transition ${
                    active
                      ? "text-neutral-950 underline underline-offset-4"
                      : "text-neutral-500 hover:text-neutral-950"
                  }`}
                >
                  {cat.name}
                </Link>
              </li>
            );
          })}

          {STATIC_ITEMS.map((item) => (
            <li key={item.href}>
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
          ))}
        </ul>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="flex flex-col gap-1.5 lg:hidden"
          aria-label="Menüyü aç"
        >
          <span className={`block h-px w-6 bg-neutral-950 transition-transform ${mobileOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block h-px w-6 bg-neutral-950 transition-opacity ${mobileOpen ? "opacity-0" : ""}`} />
          <span className={`block h-px w-6 bg-neutral-950 transition-transform ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-neutral-100 bg-white lg:hidden">
          <ul className="mx-auto max-w-6xl divide-y divide-neutral-100 px-5 sm:px-8">
            <li>
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="block py-3 text-xs font-medium uppercase tracking-wider text-neutral-700 hover:text-neutral-950"
              >
                Ana Sayfa
              </Link>
            </li>
            {categories.map((cat) => {
              const hasChildren = cat.children && cat.children.length > 0;
              return (
                <li key={cat.id}>
                  {hasChildren ? (
                    <>
                      <button
                        type="button"
                        onClick={() => toggleDropdown(cat.id)}
                        className="flex w-full items-center justify-between py-3 text-xs font-medium uppercase tracking-wider text-neutral-700"
                      >
                        {cat.name}
                        <svg
                          className={`h-3 w-3 transition-transform ${openDropdown === cat.id ? "rotate-180" : ""}`}
                          viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
                        >
                          <path d="M2 4l4 4 4-4" />
                        </svg>
                      </button>
                      {openDropdown === cat.id && (
                        <ul className="mb-2 ml-3 flex flex-col gap-2">
                          <li>
                            <Link
                              href={`/kategori/${cat.slug}`}
                              onClick={() => setMobileOpen(false)}
                              className="block py-1 text-xs font-medium uppercase tracking-wider text-neutral-500 hover:text-neutral-950"
                            >
                              Tümü
                            </Link>
                          </li>
                          {cat.children!.map((child) => (
                            <li key={child.id}>
                              <Link
                                href={`/kategori/${child.slug}`}
                                onClick={() => setMobileOpen(false)}
                                className="block py-1 text-xs font-medium uppercase tracking-wider text-neutral-500 hover:text-neutral-950"
                              >
                                {child.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link
                      href={`/kategori/${cat.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="block py-3 text-xs font-medium uppercase tracking-wider text-neutral-700 hover:text-neutral-950"
                    >
                      {cat.name}
                    </Link>
                  )}
                </li>
              );
            })}
            {STATIC_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block py-3 text-xs font-medium uppercase tracking-wider text-neutral-700 hover:text-neutral-950"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
