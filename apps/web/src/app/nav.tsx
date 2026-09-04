"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getCategories, type Category } from "./products/product-data";

const STATIC_ITEMS = [
  { label: "Hakkımızda", href: "/hakkimizda" },
  { label: "S.S.S.", href: "/sikca-sorulan-sorular" },
  { label: "İletişim", href: "/iletisim" },
];

export function MainNav() {
  const pathname = usePathname();
  const [categories, setCategories] = useState<Category[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopDropdownId, setDesktopDropdownId] = useState<string | null>(null);
  const [mobileCategoryId, setMobileCategoryId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDesktopDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  function toggleDesktopDropdown(id: string) {
    setDesktopDropdownId((prev) => (prev === id ? null : id));
  }

  function toggleMobileCategory(id: string) {
    setMobileCategoryId((prev) => (prev === id ? null : id));
  }

  function closeMobileMenu() {
    setMobileOpen(false);
    setMobileCategoryId(null);
  }

  const itemClass = (active: boolean) =>
    `whitespace-nowrap text-sm font-medium uppercase transition ${
      active ? "text-rust-dark underline underline-offset-8" : "text-brown hover:text-ink"
    }`;

  return (
    <>
      {/* Desktop nav */}
      <ul className="hidden items-center gap-4 xl:flex">
        <li>
          <Link href="/" className={itemClass(pathname === "/")}>
            Ana Sayfa
          </Link>
        </li>

        {categories.map((cat) => {
          const hasChildren = cat.children && cat.children.length > 0;
          const active = isActive(`/kategori/${cat.slug}`) ||
            cat.children?.some((c) => isActive(`/kategori/${c.slug}`));

          if (hasChildren) {
            return (
              <li key={cat.id} className="relative" ref={desktopDropdownId === cat.id ? dropdownRef : null}>
                <button
                  type="button"
                  onClick={() => toggleDesktopDropdown(cat.id)}
                  aria-expanded={desktopDropdownId === cat.id}
                  className={itemClass(!!active)}
                >
                  {cat.name}
                </button>
                {desktopDropdownId === cat.id && (
                  <ul className="absolute left-0 top-full z-50 mt-3 min-w-44 border border-brown-muted/15 bg-cream-soft py-1 shadow-lg">
                    <li>
                      <Link
                        href={`/kategori/${cat.slug}`}
                        onClick={() => setDesktopDropdownId(null)}
                        className={`block px-4 py-2 text-sm uppercase transition ${
                          isActive(`/kategori/${cat.slug}`)
                            ? "bg-cream text-ink"
                            : "text-brown hover:bg-cream hover:text-ink"
                        }`}
                      >
                        Tümü
                      </Link>
                    </li>
                    {cat.children!.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={`/kategori/${child.slug}`}
                          onClick={() => setDesktopDropdownId(null)}
                          className={`block px-4 py-2 text-sm uppercase transition ${
                            isActive(`/kategori/${child.slug}`)
                              ? "bg-cream text-ink"
                              : "text-brown hover:bg-cream hover:text-ink"
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
              <Link href={`/kategori/${cat.slug}`} className={itemClass(!!active)}>
                {cat.name}
              </Link>
            </li>
          );
        })}

        {STATIC_ITEMS.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={itemClass(isActive(item.href))}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => {
          setMobileOpen((prev) => {
            const next = !prev;
            if (!next) setMobileCategoryId(null);
            return next;
          });
        }}
        className="ml-auto flex flex-col gap-1.5 xl:hidden"
        aria-label="Menüyü aç"
        aria-expanded={mobileOpen}
      >
        <span className={`block h-px w-6 bg-ink transition-transform ${mobileOpen ? "translate-y-2 rotate-45" : ""}`} />
        <span className={`block h-px w-6 bg-ink transition-opacity ${mobileOpen ? "opacity-0" : ""}`} />
        <span className={`block h-px w-6 bg-ink transition-transform ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`} />
      </button>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute left-0 right-0 top-full z-40 border-t border-brown-muted/15 bg-cream shadow-lg xl:hidden">
          <ul className="mx-auto max-w-6xl divide-y divide-brown-muted/15 px-5 sm:px-8">
            <li>
              <Link
                href="/"
                onClick={closeMobileMenu}
                className="block py-3 text-sm font-medium uppercase text-brown hover:text-ink"
              >
                Ana Sayfa
              </Link>
            </li>
            {categories.map((cat) => {
              const hasChildren = cat.children && cat.children.length > 0;
              const submenuId = `mobile-category-${cat.id}`;
              const expanded = mobileCategoryId === cat.id;

              return (
                <li key={cat.id}>
                  {hasChildren ? (
                    <>
                      <button
                        type="button"
                        onClick={() => toggleMobileCategory(cat.id)}
                        aria-expanded={expanded}
                        aria-controls={submenuId}
                        className="flex w-full items-center justify-between py-3 text-sm font-medium uppercase text-brown"
                      >
                        {cat.name}
                        <svg
                          className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`}
                          viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
                        >
                          <path d="M2 4l4 4 4-4" />
                        </svg>
                      </button>
                      {expanded && (
                        <ul id={submenuId} className="mb-2 ml-3 flex flex-col gap-2 border-l border-brown-muted/15 pl-4">
                          <li>
                            <Link
                              href={`/kategori/${cat.slug}`}
                              onClick={closeMobileMenu}
                              className="block py-1.5 text-sm uppercase text-brown-muted hover:text-ink"
                            >
                              Tümü
                            </Link>
                          </li>
                          {cat.children!.map((child) => (
                            <li key={child.id}>
                              <Link
                                href={`/kategori/${child.slug}`}
                                onClick={closeMobileMenu}
                                className="block py-1.5 text-sm uppercase text-brown-muted hover:text-ink"
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
                      onClick={closeMobileMenu}
                      className="block py-3 text-sm font-medium uppercase text-brown hover:text-ink"
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
                  onClick={closeMobileMenu}
                  className="block py-3 text-sm font-medium uppercase text-brown hover:text-ink"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
