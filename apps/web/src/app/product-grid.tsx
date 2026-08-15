"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "./product-card";
import { EmptyState, emptyStateIcons } from "./empty-state";
import { type Category, type Product } from "./products/product-data";

type Props = {
  products: Product[];
  categories: Category[];
};

export function ProductGrid({ products, categories }: Props) {
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search") ?? "";
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState(urlSearch);
  const [syncedUrlSearch, setSyncedUrlSearch] = useState(urlSearch);

  if (urlSearch !== syncedUrlSearch) {
    setSyncedUrlSearch(urlSearch);
    setSearch(urlSearch);
  }

  const categorySlugMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    categories.forEach((cat) => {
      map[cat.slug] = [cat.slug, ...(cat.children?.map((c) => c.slug) ?? [])];
    });
    return map;
  }, [categories]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory =
        activeCategory === "all" ||
        (categorySlugMap[activeCategory]?.includes(p.category?.slug ?? "") ?? false);
      const matchesSearch = q === "" || p.name.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, search, categorySlugMap]);

  const visibleCategories = categories.filter(
    (cat) => (categorySlugMap[cat.slug] ?? []).some(
      (slug) => products.some((p) => p.category?.slug === slug)
    )
  );

  const pillsScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = pillsScrollRef.current;
    if (!el) return;

    function updateScrollState() {
      if (!el) return;
      setCanScrollRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 4);
    }

    updateScrollState();
    el.addEventListener("scroll", updateScrollState);
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [visibleCategories.length]);

  return (
    <section id="koleksiyon" className="mx-auto w-full max-w-6xl scroll-mt-20 px-6 py-12 sm:px-8 lg:px-10">
      {/* Header: heading, category filter, and "view all" in a single row.
          The category list scrolls horizontally instead of wrapping, so
          "Tümünü Gör" always stays pinned on the same line. */}
      <div className="mb-8 flex flex-wrap items-center gap-x-8 gap-y-4 pb-6">
        <h2 className="order-1 mr-4 shrink-0 font-serif text-2xl tracking-tight text-ink sm:order-none sm:mr-8 sm:text-3xl lg:mr-10">
          Koleksiyon
        </h2>

        <div className="relative order-3 w-full sm:order-none sm:w-auto sm:flex-1">
          <div ref={pillsScrollRef} className="flex items-center gap-x-6 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`shrink-0 text-sm font-medium transition ${
                activeCategory === "all"
                  ? "rounded-full bg-rust px-4 py-1.5 text-cream"
                  : "text-brown-muted hover:text-ink"
              }`}
            >
              Tümü
            </button>

            {visibleCategories.map((cat) => {
              const isActive = activeCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.slug)}
                  className={`shrink-0 text-sm font-medium transition ${
                    isActive
                      ? "rounded-full bg-rust px-4 py-1.5 text-cream"
                      : "text-brown-muted hover:text-ink"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
          {/* Hints that the pill row scrolls further, since the last item
              otherwise gets cut off flush against the edge. Driven by real
              overflow detection rather than a breakpoint guess, since
              whether the pills fit depends on how many categories exist,
              not just viewport width (e.g. it still overflows on iPad). */}
          {canScrollRight && (
            <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-cream to-transparent" />
          )}
        </div>

        <button
          type="button"
          onClick={() => { setSearch(""); setActiveCategory("all"); }}
          className="order-2 ml-auto flex shrink-0 items-center gap-1.5 text-sm font-medium text-brown transition hover:text-rust-dark sm:order-none"
        >
          Tümünü Gör
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={emptyStateIcons.search}
          title={search ? `"${search}" için sonuç bulunamadı` : "Bu kategoride ürün yok"}
          actionLabel={(search || activeCategory !== "all") ? "Tüm ürünleri göster" : undefined}
          onAction={() => { setSearch(""); setActiveCategory("all"); }}
        />
      ) : (
        <>
          {search && (
            <p className="mb-4 text-xs text-brown-muted">
              &quot;{search}&quot; için {filtered.length} ürün bulundu
            </p>
          )}
          <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
