import { getCategories, getProducts } from "./products/product-data";
import { ProductGrid } from "./product-grid";

export async function ProductGridSection() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  return <ProductGrid products={products} categories={categories} />;
}
