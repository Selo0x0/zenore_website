import type { MetadataRoute } from "next";
import { getProducts, getCategories } from "./products/product-data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const revalidate = 3600;

const staticRoutes = [
  "",
  "/hakkimizda",
  "/iletisim",
  "/gizlilik-politikasi",
  "/mesafeli-satis-sozlesmesi",
  "/iade-ve-degisim-politikasi",
  "/kvkk-aydinlatma-metni",
  "/cerez-politikasi",
  "/kullanim-kosullari",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const categorySlugs = categories.flatMap((c) => [
    c.slug,
    ...(c.children?.map((child) => child.slug) ?? []),
  ]);

  return [
    ...staticRoutes.map((route) => ({ url: `${siteUrl}${route}` })),
    ...products.map((p) => ({ url: `${siteUrl}/products/${p.slug}` })),
    ...categorySlugs.map((slug) => ({ url: `${siteUrl}/kategori/${slug}` })),
  ];
}
