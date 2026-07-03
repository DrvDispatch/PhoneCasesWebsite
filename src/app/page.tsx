import Link from "next/link";
import Image from "next/image";
import { getRegions, getFeaturedProducts } from "@/lib/queries";
import { RegionCard } from "@/components/region-card";
import { ProductCard } from "@/components/product-card";
import { TrustBadges } from "@/components/trust-badges";
import { CountrySearch } from "@/components/country-search";
import { StoreJsonLd } from "@/components/seo/json-ld";

// Server-rendered on every request => Googlebot always receives full HTML.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [regions, featured] = await Promise.all([getRegions(), getFeaturedProducts(8)]);

  return (
    <>
      <StoreJsonLd />

      {/* Hero */}
      <section className="bg-brand text-white">
        <div className="container-page grid items-center gap-8 py-14 md:grid-cols-2 md:py-20">
          <div>
            <p className="font-display text-sm uppercase tracking-[0.2em] text-accent">
              Worldwide phone cases
            </p>
            <h1 className="mt-3 font-display text-4xl leading-tight md:text-5xl">
              Bye old case.
              <br />
              Hi <span className="text-accent">GlobeCase</span>.
            </h1>
            <p className="mt-4 max-w-md text-white/80">
              Culturally inspired phone cases, organised by region. Made to order for any device —
              worldwide free shipping, 7-day returns, and 5% donated to WWF &amp; UNICEF.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/shop" className="btn btn-primary">
                Shop by region
              </Link>
              <Link href="/reviews" className="btn btn-outline border-white/30 text-white hover:text-accent">
                Read reviews
              </Link>
            </div>
          </div>
          <div className="relative">
            <Image
              src="/brand/hero.png"
              alt="GlobeCase culturally inspired phone cases"
              width={720}
              height={720}
              priority
              className="w-full rounded-2xl object-cover shadow-lg"
            />
          </div>
        </div>
      </section>

      <TrustBadges />

      {/* Regions */}
      <section className="container-page py-14">
        <div className="mb-8 text-center">
          <h2 className="font-display text-3xl uppercase tracking-wide">Shop by Region</h2>
          <p className="mt-2 text-ink-soft">Six regions. Dozens of designs. One made for you.</p>
        </div>
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

      {/* Country search */}
      <section className="bg-surface-alt py-14">
        <div className="container-page max-w-2xl text-center">
          <h2 className="font-display text-2xl uppercase tracking-wide">Find your country</h2>
          <p className="mt-2 text-ink-soft">
            Search to jump straight to the case for your heritage.
          </p>
          <div className="mt-6 text-left">
            <CountrySearch />
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="container-page py-14">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="font-display text-3xl uppercase tracking-wide">Bestsellers</h2>
            <Link href="/shop" className="text-sm font-medium text-accent">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {featured.map((p) => (
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
      )}

      {/* Reviews teaser */}
      <section className="bg-brand-dark py-14 text-white">
        <div className="container-page text-center">
          <p className="font-display text-2xl">★★★★★</p>
          <h2 className="mt-2 font-display text-2xl uppercase tracking-wide">Loved worldwide</h2>
          <p className="mx-auto mt-2 max-w-lg text-white/75">
            Customers across Europe and beyond trust GlobeCase for quality prints and fast delivery.
          </p>
          <Link href="/reviews" className="btn btn-primary mt-5">
            Read customer reviews
          </Link>
        </div>
      </section>
    </>
  );
}
