/**
 * REAL GlobeCase catalog — discovered by crawling the live Google Sites shop
 * (July 2026). Country lists, slugs and region groupings match the live site;
 * per-country product images were downloaded from the site's public CDN and are
 * self-hosted under /public/products/<slug>.png.
 *
 * Notes on the source site:
 *  - America is "coming soon" (no products yet).
 *  - Price is a flat €20; phone model is a free-text field at checkout.
 *  - The live site reused a "Dagestan" template for most product-selector
 *    embeds, so their per-design Stripe links are NOT country-specific. This
 *    store uses its own dynamic Stripe checkout, so that source bug is avoided.
 */

export const DEFAULT_PRICE_CENTS = 2000;

export type CountrySeed = { slug: string; name: string };
export type RegionSeed = {
  slug: string;
  name: string;
  blurb: string;
  image: string;
  countries: CountrySeed[];
};

export const REGIONS: RegionSeed[] = [
  {
    slug: "kavkaz",
    name: "Kavkaz",
    blurb: "Proud designs from the Caucasus — mountains, eagles and heritage.",
    image: "/regions/kavkaz.png",
    countries: [
      { slug: "abkhazia", name: "Abkhazia" },
      { slug: "armenia", name: "Armenia" },
      { slug: "ossetia", name: "Ossetia" },
      { slug: "georgia", name: "Georgia" },
      { slug: "ingushetia", name: "Ingushetia" },
      { slug: "circassia", name: "Circassia" },
      { slug: "chechnya", name: "Chechnya" },
      { slug: "dagestan", name: "Dagestan" },
    ],
  },
  {
    slug: "europe",
    name: "Europe",
    blurb: "Flags and emblems from across Europe, reimagined for your phone.",
    image: "/regions/europe.png",
    countries: [
      { slug: "italia", name: "Italy" },
      { slug: "turkey", name: "Turkey" },
      { slug: "greece", name: "Greece" },
      { slug: "belgium", name: "Belgium" },
      { slug: "russia", name: "Russia" },
      { slug: "ukraine", name: "Ukraine" },
    ],
  },
  {
    slug: "balkan",
    name: "Balkan",
    blurb: "Balkan pride — bold colours and storied national symbols.",
    image: "/regions/balkan.png",
    countries: [{ slug: "albania", name: "Albania" }],
  },
  {
    slug: "asia",
    name: "Asia",
    blurb: "From the Levant to the Pacific — designs across Asia.",
    image: "/regions/asia.png",
    countries: [
      { slug: "japan", name: "Japan" },
      { slug: "afghanistan", name: "Afghanistan" },
      { slug: "kazakhstan", name: "Kazakhstan" },
      { slug: "palestina", name: "Palestine" },
      { slug: "china", name: "China" },
      { slug: "pakistan", name: "Pakistan" },
    ],
  },
  {
    slug: "africa",
    name: "Africa",
    blurb: "Vibrant African heritage, crafted onto a case that lasts.",
    image: "/regions/africa.png",
    countries: [
      { slug: "morocco", name: "Morocco" },
      { slug: "egypt", name: "Egypt" },
    ],
  },
  {
    slug: "america",
    name: "America",
    blurb: "New designs for the Americas are on the way — coming soon.",
    image: "/regions/america.png",
    countries: [], // "still under development" on the source site
  },
];

/** Local product image path for a country slug. */
export function productImage(slug: string): string {
  return `/products/${slug}.png`;
}

export function productDescription(name: string): string {
  return (
    `Wear your roots. The ${name} Phone Case is a premium, culturally inspired ` +
    `design celebrating ${name} — printed edge to edge on a slim, shock-absorbing ` +
    `case. Made to order for any iPhone or Android model: just tell us your exact ` +
    `device at checkout. Worldwide free shipping, 7-day returns, and 5% of every ` +
    `order donated to WWF & UNICEF.`
  );
}

/** Flat list of every real product, for seeding/importing. */
export function allProducts() {
  const rows: { slug: string; name: string; regionSlug: string; regionName: string }[] = [];
  for (const r of REGIONS)
    for (const c of r.countries)
      rows.push({ slug: c.slug, name: c.name, regionSlug: r.slug, regionName: r.name });
  return rows;
}
