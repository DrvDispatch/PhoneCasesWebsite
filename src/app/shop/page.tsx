import type { Metadata } from "next";
import { getRegions, getAllActiveProducts } from "@/lib/queries";
import { RegionCard } from "@/components/region-card";
import { ProductCard } from "@/components/product-card";
import { CountrySearch } from "@/components/country-search";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop Phone Cases by Region",
  description:
    "Browse every GlobeCase design — Kavkaz, Europe, Balkan, Asia, Africa and America. Made to order for any device with worldwide free shipping.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage() {
  const [regions, products] = await Promise.all([getRegions(), getAllActiveProducts()]);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Shop", url: "/shop" },
        ]}
      />

      <section className="bg-surface-alt">
        <div className="container-page py-12 text-center">
          <h1 className="font-display text-4xl uppercase tracking-wide">Shop Phone Cases</h1>
          <p className="mx-auto mt-2 max-w-xl text-ink-soft">
            Pick your region or search your country — every case is made to order for your exact device.
          </p>
          <div className="mx-auto mt-6 max-w-xl text-left">
            <CountrySearch />
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        <h2 className="mb-6 font-display text-2xl uppercase tracking-wide">Regions</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {regions.map((r) => (
            <RegionCard
              key={r.id}
              slug={r.slug}
              name={r.name}
              blurb={r.blurb}
              image={r.image}
              count={r._count.products}
            />
          ))}
        </div>
      </section>

      <section className="container-page pb-16">
        <h2 className="mb-6 font-display text-2xl uppercase tracking-wide">All designs</h2>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              slug={p.slug}
              name={p.name}
              priceCents={p.priceCents}
              currency={p.currency}
              image={p.image}
              regionName={p.region.name}
            />
          ))}
        </div>
      </section>
    </>
  );
}
