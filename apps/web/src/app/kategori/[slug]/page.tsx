import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "../../product-card";
import { getCategory, getProductsByCategory } from "../../products/product-data";
import { EmptyState, emptyStateIcons } from "../../empty-state";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "Kategori bulunamadı | Zenore" };
  return {
    title: `${category.name} | Zenore`,
    description: `Zenore ${category.name} koleksiyonu — hakiki deri ürünler.`,
  };
}

export default async function KategoriPage({ params }: Props) {
  const { slug } = await params;
  const [category, products] = await Promise.all([
    getCategory(slug),
    getProductsByCategory(slug),
  ]);

  if (!category) notFound();

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-10 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-3 border-b border-neutral-200 pb-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-neutral-500">
            Zenore
          </p>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              {category.name}
            </h1>
            <p className="text-sm text-neutral-500">
              {products.length} ürün mevcut
            </p>
          </div>
        </header>

        {products.length === 0 ? (
          <EmptyState
            icon={emptyStateIcons.box}
            title="Bu kategoride henüz ürün bulunmamaktadır"
            description="Yakında yeni ürünler eklenecek."
          />
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
