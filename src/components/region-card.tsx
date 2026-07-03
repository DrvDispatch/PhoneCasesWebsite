import Link from "next/link";
import Image from "next/image";

type Props = {
  slug: string;
  name: string;
  blurb?: string | null;
  image?: string | null;
  count?: number;
};

export function RegionCard({ slug, name, blurb, image, count }: Props) {
  return (
    <Link
      href={`/region/${slug}`}
      className="card group relative flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-alt">
        <Image
          src={image || "/brand/hero.png"}
          alt={`${name} phone cases`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl uppercase tracking-wide">{name}</h3>
          {typeof count === "number" && (
            <span className="rounded-full bg-surface-alt px-2 py-0.5 text-xs text-ink-soft">
              {count} designs
            </span>
          )}
        </div>
        {blurb && <p className="mt-1 text-sm text-ink-soft">{blurb}</p>}
        <span className="mt-3 text-sm font-medium text-accent">Shop {name} →</span>
      </div>
    </Link>
  );
}
