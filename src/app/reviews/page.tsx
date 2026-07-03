import type { Metadata } from "next";
import Script from "next/script";
import { getApprovedReviews } from "@/lib/queries";

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
  const reviews = await getApprovedReviews();

  return (
    <div className="container-page py-14">
      <div className="text-center">
        <h1 className="font-display text-4xl uppercase tracking-wide">Customer Reviews</h1>
        <p className="mt-2 text-ink-soft">Real feedback from GlobeCase customers worldwide.</p>
      </div>

      {reviews.length > 0 && (
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <figure key={r.id} className="card p-5">
              <Stars n={r.rating} />
              <blockquote className="mt-2 text-ink">{r.body}</blockquote>
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
