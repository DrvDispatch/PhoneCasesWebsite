import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getProductBySlug,
  getAllActiveProducts,
  getReviewStats,
  getApprovedReviews,
} from "@/lib/queries";
import { ProductImage } from "@/components/product-image";
import { formatMoney } from "@/lib/money";
import { AddToCart } from "@/components/add-to-cart";
import { RelatedProducts } from "@/components/related-products";
import { RatingBadge, ReviewCard, Stars } from "@/components/reviews";
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { TRUST_BADGES } from "@/lib/site";
import { TRUST_ICONS, IconTag } from "@/components/icons";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${product.name} | GlobeCase`,
      description: product.description.slice(0, 200),
      images: product.image ? [{ url: product.image }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const inStock = product.stock === null || product.stock > 0;

  const [othersAll, reviewStats, reviews] = await Promise.all([
    getAllActiveProducts(),
    getReviewStats(),
    getApprovedReviews(6),
  ]);

  const others = othersAll
    .filter((p) => p.slug !== product.slug)
    .slice(0, 12)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      priceCents: p.priceCents,
      currency: p.currency,
      image: p.image,
      regionName: p.region.name,
      imageFit: p.imageFit,
      imageScale: p.imageScale,
      imageBg: p.imageBg,
    }));

  return (
    <>
      <ProductJsonLd
        name={product.name}
        description={product.description}
        image={product.image}
        slug={product.slug}
        priceCents={product.priceCents}
        currency={product.currency}
        inStock={inStock}
        rating={{ average: reviewStats.average, count: reviewStats.count }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Shop", url: "/shop" },
          { name: product.region.name, url: `/region/${product.region.slug}` },
          { name: product.name, url: `/product/${product.slug}` },
        ]}
      />

      <div className="container-page py-10">
        <nav className="mb-6 text-sm text-ink-soft">
          <Link href="/shop" className="hover:text-ink">
            Shop
          </Link>{" "}
          /{" "}
          <Link href={`/region/${product.region.slug}`} className="hover:text-ink">
            {product.region.name}
          </Link>{" "}
          / <span className="text-ink">{product.name}</span>
        </nav>

        <div className="grid gap-10 md:grid-cols-2">
          <ProductImage
            src={product.image}
            alt={product.name}
            sizes="(max-width: 768px) 100vw, 560px"
            priority
            boxClassName="aspect-square rounded-2xl border border-line"
            appearance={product}
          />

          <div>
            <span className="text-xs uppercase tracking-wide text-ink-soft">
              {product.region.name}
            </span>
            <h1 className="mt-1 font-display text-3xl md:text-4xl">{product.name}</h1>
            {reviewStats.count > 0 && (
              <div className="mt-2">
                <RatingBadge average={reviewStats.average} count={reviewStats.count} href="#reviews" />
              </div>
            )}
            <p className="mt-3 text-2xl font-semibold text-brand">
              {formatMoney(product.priceCents, product.currency)}
            </p>
            <p className="mt-4 text-ink-soft">{product.description}</p>

            <div className="mt-6 rounded-2xl border border-line p-5">
              {inStock ? (
                <AddToCart
                  product={{
                    slug: product.slug,
                    name: product.name,
                    priceCents: product.priceCents,
                    currency: product.currency,
                    image: product.image,
                  }}
                  designImages={product.designImages}
                />
              ) : (
                <p className="text-danger">Currently sold out — check back soon.</p>
              )}
            </div>

            {/* Buy 2 get 1 free (#17) — below the choices/qty, above the badges */}
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-brand/5 px-4 py-3 text-sm font-medium text-brand">
              <IconTag className="h-5 w-5 shrink-0 text-accent" />
              <span>
                <strong>Buy 2, get 1 free</strong> — mix &amp; match any designs. Your cheapest case is
                free at checkout.
              </span>
            </div>

            <ul className="mt-6 grid grid-cols-3 gap-3 text-center text-xs sm:text-sm">
              {TRUST_BADGES.map((b) => {
                const Icon = TRUST_ICONS[b.icon];
                return (
                  <li
                    key={b.title}
                    className="flex flex-col items-center gap-1.5 sm:flex-row sm:justify-center sm:gap-2"
                  >
                    <Icon className="h-5 w-5 shrink-0 text-accent" />
                    <span className="leading-tight text-ink-soft">{b.title}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {reviews.length > 0 && (
        <section id="reviews" className="border-t border-line bg-surface-alt scroll-mt-20">
          <div className="container-page py-10 sm:py-14">
            <div className="mb-6 text-center">
              <h2 className="font-display text-2xl uppercase tracking-wide sm:text-3xl">
                Loved by customers
              </h2>
              <div className="mt-2 flex items-center justify-center gap-2">
                <Stars rating={Math.round(reviewStats.average)} className="h-5 w-5" />
                <span className="text-sm text-ink-soft">
                  <strong className="text-ink">{reviewStats.average.toFixed(1)}</strong> ·{" "}
                  {reviewStats.count} Google reviews
                </span>
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link href="/reviews" className="btn btn-outline text-sm">
                Read all reviews
              </Link>
            </div>
          </div>
        </section>
      )}

      <RelatedProducts
        products={others}
        title="Don't forget a present for your family & friends"
        subtitle="2 + 1 free"
      />
    </>
  );
}
