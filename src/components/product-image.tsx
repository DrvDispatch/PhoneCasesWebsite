import Image from "next/image";

export type ImageAppearance = {
  imageFit?: string | null; // "contain" | "cover"
  imageScale?: number | null; // percent
  imageBg?: string | null; // hex/color
};

/**
 * True for admin-uploaded images (mounted volume, served directly by Nginx).
 *
 * These must skip Next's image optimizer: the standalone server only serves
 * `public/` files that existed when it started, so the optimizer's own fetch of
 * a runtime upload 404s and it returns "The requested resource isn't a valid
 * image". Nothing is lost — /api/admin/upload already re-encodes uploads to
 * webp at <=1400px.
 */
export function isUpload(src?: string | null): boolean {
  return !!src && src.startsWith("/uploads/");
}

/** The CSS applied to the <img> to honour a product's appearance settings. */
export function appearanceStyle(a?: ImageAppearance): React.CSSProperties {
  const objectFit = a?.imageFit === "cover" ? "cover" : "contain";
  const scale = Math.max(40, Math.min(200, a?.imageScale ?? 100)) / 100;
  return { objectFit, transform: `scale(${scale})` };
}

/**
 * Product image with per-product appearance (fit / zoom / background).
 * The parent-provided `boxClassName` sets the aspect ratio + rounding.
 */
export function ProductImage({
  src,
  alt,
  sizes,
  priority,
  boxClassName,
  appearance,
}: {
  src?: string | null;
  alt: string;
  sizes?: string;
  priority?: boolean;
  boxClassName?: string;
  appearance?: ImageAppearance;
}) {
  const bg = appearance?.imageBg || "#f7f8f9";
  return (
    <div className={`relative overflow-hidden ${boxClassName ?? ""}`} style={{ background: bg }}>
      <Image
        src={src || "/brand/hero.png"}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={isUpload(src)}
        style={appearanceStyle(appearance)}
      />
    </div>
  );
}
