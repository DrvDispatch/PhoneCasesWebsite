import { ProductCard } from "./product-card";

type Item = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  currency: string;
  image?: string | null;
  regionName?: string;
};

/**
 * Horizontal, touch-friendly cross-sell slider (CSS scroll-snap, no JS).
 * Reuses the shop ProductCard so it matches the rest of the store.
 */
export function RelatedProducts({
  products,
  title,
  subtitle,
}: {
  products: Item[];
  title: string;
  subtitle?: string;
}) {
  if (!products.length) return null;
  return (
    <section className="border-t border-line bg-surface-alt">
      <div className="container-page py-10 sm:py-14">
        <div className="mb-6 text-center">
          <h2 className="font-display text-2xl uppercase tracking-wide sm:text-3xl">{title}</h2>
          {subtitle && (
            <span className="mt-3 inline-block rounded-full bg-brand px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
              {subtitle}
            </span>
          )}
        </div>
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4">
          {products.map((p) => (
            <div key={p.id} className="w-[46%] min-w-[150px] shrink-0 snap-start sm:w-[220px]">
              <ProductCard
                slug={p.slug}
                name={p.name}
                priceCents={p.priceCents}
                currency={p.currency}
                image={p.image}
                regionName={p.regionName}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
