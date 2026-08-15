import { Suspense } from "react";
import { HomeHero } from "./home-hero";
import { ProductGridSection } from "./product-grid-section";
import { ProductGridSkeleton } from "./product-grid-skeleton";
import { TrustBadges } from "./trust-badges";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <HomeHero />
      <TrustBadges />
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductGridSection />
      </Suspense>
    </main>
  );
}
