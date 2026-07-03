import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getProductBySlug } from "@/lib/queries";
import { formatMoney } from "@/lib/money";
import { AddToCart } from "@/components/add-to-cart";
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { TRUST_BADGES } from "@/lib/site";

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
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-surface-alt">
            <Image
              src={product.image || "/brand/hero.png"}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 560px"
              priority
              className="object-cover"
            />
          </div>

          <div>
            <span className="text-xs uppercase tracking-wide text-ink-soft">
              {product.region.name}
            </span>
            <h1 className="mt-1 font-display text-3xl md:text-4xl">{product.name}</h1>
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
                />
              ) : (
                <p className="text-danger">Currently sold out — check back soon.</p>
              )}
            </div>

            <ul className="mt-6 grid grid-cols-2 gap-3 text-sm">
              {TRUST_BADGES.map((b) => (
                <li key={b.title} className="flex items-center gap-2">
                  <span aria-hidden>{b.icon}</span>
                  <span className="text-ink-soft">{b.title}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
