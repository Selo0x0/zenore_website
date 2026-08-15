"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProductImage } from "./product-image";
import { apiUrl, formatPrice, getImageUrl, type Product } from "./products/product-data";

const MAX_SUGGESTIONS = 5;

export function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open || productsLoaded) return;
    fetch(`${apiUrl}/products`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Product[]) => {
        setProducts(data);
        setProductsLoaded(true);
      })
      .catch(() => {});
  }, [open, productsLoaded]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const query = value.trim().toLowerCase();

  const suggestions = useMemo(() => {
    if (!query) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(query))
      .slice(0, MAX_SUGGESTIONS);
  }, [products, query]);

  const totalMatches = useMemo(() => {
    if (!query) return 0;
    return products.filter((p) => p.name.toLowerCase().includes(query)).length;
  }, [products, query]);

  function close() {
    setOpen(false);
    setValue("");
  }

  function goToResults(q: string) {
    router.push(`/?search=${encodeURIComponent(q)}#koleksiyon`);
    close();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query) return;
    goToResults(value.trim());
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ürün ara"
        className="flex h-9 w-9 items-center justify-center text-ink transition hover:text-rust-dark"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]"
            onClick={close}
          />
          <div className="absolute left-0 right-0 top-0 max-h-[85vh] overflow-y-auto border-b border-brown-muted/15 bg-cream-soft shadow-lg">
            <form
              onSubmit={handleSubmit}
              className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-7 sm:px-8"
            >
              <svg className="h-5 w-5 shrink-0 text-brown-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Ne arıyorsunuz?"
                className="flex-1 border-0 border-b border-brown-muted/20 bg-transparent pb-2 font-serif text-xl text-ink outline-none transition placeholder:text-brown-muted/50 focus:border-rust sm:text-2xl"
              />
              <button
                type="button"
                onClick={close}
                aria-label="Kapat"
                className="shrink-0 text-brown-muted transition hover:text-ink"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </form>

            {query && (
              <div className="mx-auto max-w-3xl px-5 pb-6 sm:px-8">
                {suggestions.length > 0 ? (
                  <>
                    <ul className="flex flex-col divide-y divide-brown-muted/10 border-t border-brown-muted/10">
                      {suggestions.map((product) => {
                        const img = product.images[0];
                        return (
                          <li key={product.id}>
                            <Link
                              href={`/products/${product.slug}`}
                              onClick={close}
                              className="flex items-center gap-4 py-3 transition hover:bg-cream"
                            >
                              <div className="relative h-12 w-12 shrink-0 overflow-hidden bg-cream">
                                <ProductImage src={getImageUrl(img)} alt={img?.alt ?? product.name} />
                              </div>
                              <span className="flex-1 truncate text-sm text-ink">{product.name}</span>
                              <span className="shrink-0 text-sm font-semibold text-ink">
                                {formatPrice(product.priceKurus, product.currency)}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                    {totalMatches > MAX_SUGGESTIONS && (
                      <button
                        type="button"
                        onClick={() => goToResults(value.trim())}
                        className="mt-4 text-sm font-medium text-rust-dark underline underline-offset-4 hover:text-ink"
                      >
                        Tüm {totalMatches} sonucu gör
                      </button>
                    )}
                  </>
                ) : productsLoaded ? (
                  <p className="border-t border-brown-muted/10 pt-4 text-sm text-brown-muted">
                    &quot;{value.trim()}&quot; için sonuç bulunamadı.
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
