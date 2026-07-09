import type { Metadata } from "next";
import Script from "next/script";
import { getApprovedReviews } from "@/lib/queries";
import { getSetting, SETTING_KEYS } from "@/lib/settings";
import { IconMapPin } from "@/components/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Customer Reviews",
  description: "See what GlobeCase customers say about our culturally inspired phone cases.",
  alternates: { canonical: "/reviews" },
};

function Stars({ n }: { n: number }) {
  return (
    <span aria-label={`${n} out of 5 stars`} className="text-accent">
      {"★".repeat(n)}
      <span className="text-line">{"★".repeat(5 - n)}</span>
    </span>
  );
}

export default async function ReviewsPage() {
  const [reviews, mapsUrl] = await Promise.all([
    getApprovedReviews(),
    getSetting(SETTING_KEYS.googleMapsUrl),
  ]);

  return (
    <div className="container-page py-14">
      <div className="text-center">
        <h1 className="font-display text-3xl uppercase tracking-wide sm:text-4xl">Customer Reviews</h1>
        <p className="mt-2 text-ink-soft">Real feedback from GlobeCase customers worldwide.</p>
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline mt-5 inline-flex text-sm"
          >
            <IconMapPin className="h-4 w-4 text-accent" /> See us on Google
          </a>
        )}
      </div>

      {reviews.length > 0 && (
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <figure key={r.id} className="card p-5">
              <Stars n={r.rating} />
              <blockquote className="mt-2 text-ink">{r.body}</blockquote>
              {r.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.imageUrl}
                  alt=""
                  className="mt-3 h-40 w-full rounded-lg border border-line object-cover"
                />
              )}
              <figcaption className="mt-3 text-sm text-ink-soft">— {r.author}</figcaption>
            </figure>
          ))}
        </div>
      )}

      {/* EmbedSocial widget (progressive enhancement) */}
      <div className="mt-12">
        <div className="embedsocial-hashtag" data-ref="815f01c9bc7535a48b8592ce1318cc71" />
        {reviews.length === 0 && (
          <p className="text-center text-ink-soft">Reviews are loading — check back shortly.</p>
        )}
      </div>
      <Script src="https://embedsocial.com/cdn/ht.js" strategy="lazyOnload" id="EmbedSocialHashtagScript" />
    </div>
  );
}
