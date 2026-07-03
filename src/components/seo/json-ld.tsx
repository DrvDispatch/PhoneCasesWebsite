import { SITE, SOCIAL_LINKS } from "@/lib/site";
import { formatMoney } from "@/lib/money";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Structured data is static, server-rendered JSON — safe to inline.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Organization + WebSite (with sitelinks search) — brand entity for Google. */
export function SiteJsonLd() {
  const sameAs = SOCIAL_LINKS.filter((s) => s.href.startsWith("http")).map((s) => s.href);
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: SITE.name,
          url: SITE_URL,
          logo: `${SITE_URL}/brand/hero.png`,
          email: SITE.supportEmail,
          sameAs,
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE.name,
          url: SITE_URL,
          potentialAction: {
            "@type": "SearchAction",
            target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
            "query-input": "required name=search_term_string",
          },
        }}
      />
    </>
  );
}

export function StoreJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Store",
        name: SITE.name,
        description: SITE.description,
        url: SITE_URL,
        image: `${SITE_URL}/brand/hero.png`,
        priceRange: "€20",
        currenciesAccepted: "EUR",
        paymentAccepted: "Stripe, PayPal, Klarna, Credit Card",
        email: SITE.supportEmail,
        sameAs: SOCIAL_LINKS.filter((s) => s.href.startsWith("http")).map((s) => s.href),
      }}
    />
  );
}

export function ProductJsonLd({
  name,
  description,
  image,
  slug,
  priceCents,
  currency,
  inStock = true,
}: {
  name: string;
  description: string;
  image?: string | null;
  slug: string;
  priceCents: number;
  currency: string;
  inStock?: boolean;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Product",
        name,
        description,
        image: image ? [image] : [`${SITE_URL}/brand/hero.png`],
        brand: { "@type": "Brand", name: SITE.name },
        offers: {
          "@type": "Offer",
          url: `${SITE_URL}/product/${slug}`,
          priceCurrency: currency.toUpperCase(),
          price: (priceCents / 100).toFixed(2),
          availability: inStock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          priceValidUntil: `${new Date().getFullYear() + 1}-12-31`,
          shippingDetails: {
            "@type": "OfferShippingDetails",
            shippingRate: { "@type": "MonetaryAmount", value: "0", currency: currency.toUpperCase() },
          },
        },
        // Human label kept in sync for snippets.
        offersLabel: formatMoney(priceCents, currency),
      }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((it, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: it.name,
          item: `${SITE_URL}${it.url}`,
        })),
      }}
    />
  );
}
