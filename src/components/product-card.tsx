import Link from "next/link";
import Image from "next/image";
import { formatMoney } from "@/lib/money";

type Props = {
  slug: string;
  name: string;
  priceCents: number;
  currency: string;
  image?: string | null;
  regionName?: string;
};

export function ProductCard({ slug, name, priceCents, currency, image, regionName }: Props) {
  return (
    <Link
      href={`/product/${slug}`}
      className="card group flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-surface-alt">
        <Image
          src={image || "/brand/hero.png"}
          alt={name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        {regionName && (
          <span className="text-xs uppercase tracking-wide text-ink-soft">{regionName}</span>
        )}
        <h3 className="mt-1 font-display text-base leading-tight">{name}</h3>
        <p className="mt-auto pt-2 font-semibold text-brand">{formatMoney(priceCents, currency)}</p>
      </div>
    </Link>
  );
}
