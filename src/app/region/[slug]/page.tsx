import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getRegionBySlug } from "@/lib/queries";
import { ProductCard } from "@/components/product-card";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const region = await getRegionBySlug(slug);
  if (!region) return { title: "Region not found" };
  return {
    title: `${region.name} Phone Cases`,
    description:
      region.blurb ||
      `Shop ${region.name} phone cases — culturally inspired designs made to order for any device.`,
    alternates: { canonical: `/region/${region.slug}` },
    openGraph: {
      title: `${region.name} Phone Cases | GlobeCase`,
      images: region.image ? [{ url: region.image }] : undefined,
    },
  };
}

export default async function RegionPage({ params }: Params) {
  const { slug } = await params;
  const region = await getRegionBySlug(slug);
  if (!region) notFound();

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Shop", url: "/shop" },
          { name: region.name, url: `/region/${region.slug}` },
        ]}
      />

      <section className="bg-brand text-white">
        <div className="container-page py-10 sm:py-12">
          <nav className="text-sm text-white/60">
            <Link href="/shop" className="hover:text-white">
              Shop
            </Link>{" "}
            / <span className="text-white">{region.name}</span>
          </nav>
          <h1 className="mt-2 font-display text-3xl uppercase tracking-wide sm:text-4xl">{region.name}</h1>
          {region.blurb && <p className="mt-2 max-w-xl text-white/80">{region.blurb}</p>}
        </div>
      </section>

      <section className="container-page py-10 sm:py-12">
        {region.products.length === 0 ? (
          <p className="text-ink-soft">No designs here yet — check back soon.</p>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {region.products.map((p) => (
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
                regionName={region.name}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
