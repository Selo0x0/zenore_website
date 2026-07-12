"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "./product-card";
import { EmptyState, emptyStateIcons } from "./empty-state";
import { type Category, type Product } from "./products/product-data";

type Props = {
  products: Product[];
  categories: Category[];
};

export function ProductGrid({ products, categories }: Props) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

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

  return (
    <section id="koleksiyon" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-12 sm:px-8 lg:px-10">
      {/* Header */}
      <div className="mb-10 flex items-end justify-between border-b border-neutral-200 pb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
          Koleksiyon
        </h2>
        <p className="text-sm text-neutral-400">{products.length} ürün</p>
      </div>

      {/* Search + category filter */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Category pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition ${
              activeCategory === "all"
                ? "bg-neutral-950 text-white"
                : "bg-white text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 border border-neutral-200"
            }`}
          >
            Tümü
            <span className={`ml-1.5 tabular-nums ${activeCategory === "all" ? "opacity-60" : "opacity-50"}`}>
              {products.length}
            </span>
          </button>

          {visibleCategories.map((cat) => {
            const count = products.filter((p) =>
              categorySlugMap[cat.slug]?.includes(p.category?.slug ?? "")
            ).length;
            const isActive = activeCategory === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.slug)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition ${
                  isActive
                    ? "bg-neutral-950 text-white"
                    : "bg-white text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 border border-neutral-200"
                }`}
              >
                {cat.name}
                <span className={`ml-1.5 tabular-nums ${isActive ? "opacity-60" : "opacity-50"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative shrink-0 sm:w-52">
          <svg
            className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400 pointer-events-none"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Ürün ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-neutral-200 bg-white py-2 pl-9 pr-4 text-xs text-neutral-950 outline-none transition focus:border-neutral-950 placeholder:text-neutral-400"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-950"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
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
          {(search || activeCategory !== "all") && (
            <p className="mb-4 text-xs text-neutral-400">{filtered.length} ürün bulundu</p>
          )}
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
