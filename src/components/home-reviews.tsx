import { IconStar, IconMapPin } from "@/components/icons";

/** Home review strip (#21): rating + counter + photos, above the country search. */
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

  return (
    <section aria-label="Customer reviews" className="border-b border-line bg-surface">
      <div className="container-page py-8 text-center">
        <div className="flex items-center justify-center gap-1 text-accent">
          {Array.from({ length: 5 }).map((_, i) => (
            <IconStar key={i} fill="currentColor" className={`h-5 w-5 ${i < full ? "" : "opacity-25"}`} />
          ))}
        </div>
        <p className="mt-2 text-sm text-ink-soft">
          <strong className="text-ink">{average.toFixed(1)}/5</strong>
          {count > 0 ? ` from ${count} Google reviews` : ""}
        </p>

        {photos.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {photos.slice(0, 5).map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${src}-${i}`}
                src={src}
                alt="Customer photo"
                className="h-16 w-16 rounded-lg border border-line object-cover sm:h-20 sm:w-20"
              />
            ))}
          </div>
        )}

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
