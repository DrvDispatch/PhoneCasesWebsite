import Link from "next/link";
import Image from "next/image";
import { getRegions, getFeaturedProducts, getReviewStats, getReviewFaces } from "@/lib/queries";
import { getSettings, SETTING_KEYS, parseUrlList } from "@/lib/settings";
import { RegionCard } from "@/components/region-card";
import { ProductCard } from "@/components/product-card";
import { TrustBadges } from "@/components/trust-badges";
import { HomeReviews } from "@/components/home-reviews";
import { NewsletterBand } from "@/components/newsletter-band";
import { PaymentTrustBar } from "@/components/payment-trust-bar";
import { CountrySearch } from "@/components/country-search";
import { StoreJsonLd, SiteJsonLd } from "@/components/seo/json-ld";

// Server-rendered on every request => Googlebot always receives full HTML.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [regions, featured, reviewStats, reviewPhotos, settings] = await Promise.all([
    getRegions(),
    getFeaturedProducts(8),
    getReviewStats(),
    getReviewFaces(5),
    getSettings([SETTING_KEYS.homeReviewPhotos, SETTING_KEYS.googleMapsUrl]),
  ]);

  const settingPhotos = parseUrlList(settings[SETTING_KEYS.homeReviewPhotos]);
  const reviewImages = settingPhotos.length ? settingPhotos : reviewPhotos;
  const mapsUrl = settings[SETTING_KEYS.googleMapsUrl] || null;

  return (
    <>
      <StoreJsonLd />
      <SiteJsonLd />

      {/* Hero */}
      <section className="bg-brand text-white">
        <div className="container-page grid items-center gap-8 py-12 md:grid-cols-2 md:py-20">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.2em] text-accent sm:text-sm">
              Worldwide phone cases
            </p>
            <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
              Bye old case.
              <br />
              Hi <span className="text-accent">GlobeCase</span>.
            </h1>
            <p className="mt-4 max-w-md text-sm text-white/80 sm:text-base">
              Culturally inspired phone cases, organised by region. Made to order for any device —
              worldwide free shipping and 7-day returns.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/shop" className="btn btn-primary w-full sm:w-auto">
                Shop by region
              </Link>
              <Link
                href="/reviews"
                className="btn btn-outline w-full border-white/30 text-white hover:text-accent sm:w-auto"
              >
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

      {/* Review strip — below the badges, above the search (#21) */}
      <HomeReviews
        count={reviewStats.count}
        average={reviewStats.average}
        photos={reviewImages}
        mapsUrl={mapsUrl}
      />

      {/* Country search — near the top so it's easy to find */}
      <section className="bg-surface-alt py-10 sm:py-14">
        <div className="container-page max-w-2xl text-center">
          <h2 className="font-display text-2xl uppercase tracking-wide">Find your country</h2>
          <p className="mt-2 text-sm text-ink-soft sm:text-base">
            Search to jump straight to the case for your heritage.
          </p>
          <div className="mt-6 text-left">
            <CountrySearch />
          </div>
        </div>
      </section>

      {/* Regions */}
      <section className="container-page py-10 sm:py-14">
        <div className="mb-8 text-center">
          <h2 className="font-display text-2xl uppercase tracking-wide sm:text-3xl">
            Shop by Region
          </h2>
          <p className="mt-2 text-sm text-ink-soft sm:text-base">
            Six regions. Dozens of designs. One made for you.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
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

      {/* Featured */}
      {featured.length > 0 && (
        <section className="container-page py-10 sm:py-14">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="font-display text-2xl uppercase tracking-wide sm:text-3xl">Bestsellers</h2>
            <Link href="/shop" className="text-sm font-semibold text-brand transition hover:text-accent">
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
                imageFit={p.imageFit}
                imageScale={p.imageScale}
                imageBg={p.imageBg}
                regionName={p.region.name}
              />
            ))}
          </div>
        </section>
      )}

      {/* Subscribe band + payment/guarantee trust bar (#22) */}
      <NewsletterBand />
      <PaymentTrustBar />
    </>
  );
}
