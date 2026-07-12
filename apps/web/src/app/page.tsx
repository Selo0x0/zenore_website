import { Suspense } from "react";
import { HomeHero } from "./home-hero";
import { ProductGridSection } from "./product-grid-section";
import { ProductGridSkeleton } from "./product-grid-skeleton";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <HomeHero />
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductGridSection />
      </Suspense>
    </main>
  );
}
