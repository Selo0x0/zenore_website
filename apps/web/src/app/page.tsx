import { getCategories, getProducts } from "./products/product-data";
import { HomeHero } from "./home-hero";
import { ProductGrid } from "./product-grid";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <HomeHero />
      <ProductGrid products={products} categories={categories} />
    </main>
  );
}
