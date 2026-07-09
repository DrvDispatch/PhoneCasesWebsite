import type { Metadata } from "next";
import Link from "next/link";
import { searchProducts } from "@/lib/queries";
import { ProductCard } from "@/components/product-card";
import { CountrySearch } from "@/components/country-search";

export const dynamic = "force-dynamic";

type Search = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Search): Promise<Metadata> {
  const { q } = await searchParams;
  const term = (q ?? "").trim();
  return {
    title: term ? `Search: ${term}` : "Search phone cases",
    description: term
      ? `Phone cases matching “${term}” — made to order, worldwide free shipping.`
      : "Search GlobeCase phone cases by country.",
    // Search result pages shouldn't be indexed (thin/duplicative), but keep links followable.
    robots: { index: false, follow: true },
    alternates: { canonical: "/shop" },
  };
}

export default async function SearchPage({ searchParams }: Search) {
  const { q } = await searchParams;
  const term = (q ?? "").trim();
  const results = term ? await searchProducts(term, 24) : [];

  return (
    <div className="container-page py-12">
      <h1 className="font-display text-3xl uppercase tracking-wide">
        {term ? `Results for “${term}”` : "Search"}
      </h1>
      <div className="mt-5 max-w-xl">
        <CountrySearch />
      </div>

      {term && results.length === 0 && (
        <p className="mt-8 text-ink-soft">
          No cases match “{term}”.{" "}
          <Link href="/shop" className="font-medium text-brand underline">
            Browse all regions
          </Link>
          .
        </p>
      )}

      {results.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((p) => (
            <ProductCard
              key={p.id}
              slug={p.slug}
              name={p.name}
              priceCents={p.priceCents}
              currency={p.currency}
              image={p.image}
              imageFit={p.imageFit}
              imageScale={p.imageScale}
              imageBg={p.imageBg}
              regionName={p.region.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}
