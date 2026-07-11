import { IconStar, IconMapPin } from "@/components/icons";

/**
 * Home review counter (#21): a prominent "N five-star reviews" headline with a
 * stack of round reviewer photos — styled after the reference the client shared,
 * sitting between the trust badges and the country search.
 */
export function HomeReviews({
  count,
  average,
  photos,
  mapsUrl,
}: {
  count: number;
  average: number;
  photos: string[];
  mapsUrl?: string | null;
}) {
  if (count === 0 && photos.length === 0) return null;
  const full = Math.round(average);
  const faces = photos.slice(0, 5);

  return (
    <section aria-label="Customer reviews" className="border-b border-line bg-surface">
      <div className="container-page py-9 text-center sm:py-11">
        {faces.length > 0 && (
          <div className="mb-4 flex justify-center -space-x-3">
            {faces.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${src}-${i}`}
                src={src}
                alt="Happy GlobeCase customer"
                loading="lazy"
                referrerPolicy="no-referrer"
                className="h-12 w-12 rounded-full border-2 border-surface object-cover shadow-sm sm:h-14 sm:w-14"
                style={{ zIndex: faces.length - i }}
              />
            ))}
          </div>
        )}

        <div className="flex items-center justify-center gap-1 text-accent">
          {Array.from({ length: 5 }).map((_, i) => (
            <IconStar key={i} fill="currentColor" className={`h-5 w-5 ${i < full ? "" : "opacity-25"}`} />
          ))}
        </div>

        {count > 0 && (
          <p className="mt-2 font-display text-xl uppercase tracking-wide sm:text-2xl">
            {count} five-star {count === 1 ? "review" : "reviews"}
          </p>
        )}
        <p className="mt-1 text-sm text-ink-soft">
          Rated <strong className="text-ink">{average.toFixed(1)}/5</strong> by real customers on Google
        </p>

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
    </section>
  );
}
