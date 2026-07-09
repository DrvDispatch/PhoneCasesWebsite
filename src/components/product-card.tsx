import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { ProductImage, type ImageAppearance } from "./product-image";

type Props = {
  slug: string;
  name: string;
  priceCents: number;
  currency: string;
  image?: string | null;
  regionName?: string;
} & ImageAppearance;

export function ProductCard({
  slug,
  name,
  priceCents,
  currency,
  image,
  regionName,
  imageFit,
  imageScale,
  imageBg,
}: Props) {
  return (
    <Link
      href={`/product/${slug}`}
      className="card group flex h-full flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-md"
    >
      <ProductImage
        src={image}
        alt={name}
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
        boxClassName="aspect-square"
        appearance={{ imageFit, imageScale, imageBg }}
      />
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
