import { IconStar } from "@/components/icons";

export function Stars({ rating, className = "h-4 w-4" }: { rating: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-accent" role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <IconStar key={i} fill="currentColor" className={`${className} ${i < rating ? "" : "opacity-25"}`} />
      ))}
    </span>
  );
}

const AVATAR_COLORS = ["#1a3c34", "#c8964e", "#7c4a2d", "#2a5248", "#8a6a2e", "#3b5b6b", "#6b4a6b", "#9a4a3a"];
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "★";
}
function colorFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

/** Reviewer avatar — real photo if available, else a coloured initials circle. */
export function Avatar({ name, src, size = 40 }: { name: string; src?: string | null; size?: number }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        className="flex-none rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="grid flex-none place-items-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: colorFor(name), fontSize: size * 0.4 }}
    >
      {initials(name)}
    </span>
  );
}

/** Compact rating summary (used on product pages). */
export function RatingBadge({ average, count, href = "/reviews" }: { average: number; count: number; href?: string }) {
  if (!count) return null;
  return (
    <a href={href} className="inline-flex items-center gap-2 text-sm transition hover:opacity-80">
      <Stars rating={Math.round(average)} />
      <span className="font-semibold text-ink">{average.toFixed(1)}</span>
      <span className="text-ink-soft">· {count} Google reviews</span>
    </a>
  );
}

export type ReviewItem = {
  id: string;
  author: string;
  rating: number;
  body: string;
  avatarUrl?: string | null;
  photos?: string[];
  dateLabel?: string | null;
  createdAt?: Date | string;
};

/** A Google-style review card: avatar, name, stars, date, text, attached photos. */
export function ReviewCard({ review }: { review: ReviewItem }) {
  const date = review.dateLabel?.trim() || "";
  return (
    <figure className="card flex h-full flex-col p-5">
      <div className="flex items-center gap-3">
        <Avatar name={review.author} src={review.avatarUrl} />
        <div className="min-w-0">
          <figcaption className="truncate font-medium text-ink">{review.author}</figcaption>
          <div className="mt-0.5 flex items-center gap-2">
            <Stars rating={review.rating} className="h-3.5 w-3.5" />
            {date && <span className="text-xs text-ink-soft">{date}</span>}
          </div>
        </div>
      </div>
      <blockquote className="mt-3 flex-1 text-sm text-ink-soft">{review.body}</blockquote>
      {review.photos && review.photos.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {review.photos.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${src}-${i}`}
              src={src}
              alt="Customer photo"
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-20 w-20 rounded-lg border border-line object-cover"
            />
          ))}
        </div>
      )}
    </figure>
  );
}
