import type { Metadata } from "next";
import { getApprovedReviews, getReviewStats } from "@/lib/queries";
import { getSetting, SETTING_KEYS } from "@/lib/settings";
import { IconMapPin } from "@/components/icons";
import { Stars, ReviewCard } from "@/components/reviews";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Customer Reviews",
  description: "See what GlobeCase customers say — real 5-star Google reviews.",
  alternates: { canonical: "/reviews" },
};

export default async function ReviewsPage() {
  const [reviews, stats, mapsUrl] = await Promise.all([
    getApprovedReviews(),
    getReviewStats(),
    getSetting(SETTING_KEYS.googleMapsUrl),
  ]);

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="text-center">
        <h1 className="font-display text-3xl uppercase tracking-wide sm:text-4xl">Customer Reviews</h1>
        {stats.count > 0 && (
          <div className="mt-4 flex flex-col items-center gap-1">
            <Stars rating={Math.round(stats.average)} className="h-6 w-6" />
            <p className="text-sm text-ink-soft">
              <strong className="text-ink">{stats.average.toFixed(1)}</strong> from {stats.count} Google
              reviews
            </p>
          </div>
        )}
        {mapsUrl && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary inline-flex text-sm">
              <IconMapPin className="h-4 w-4" /> Rate us on Google
            </a>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline inline-flex text-sm">
              See all on Google
            </a>
          </div>
        )}
      </div>

      {reviews.length > 0 ? (
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-center text-ink-soft">Reviews are coming soon.</p>
      )}
    </div>
  );
}
