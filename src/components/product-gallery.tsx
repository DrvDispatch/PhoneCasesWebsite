"use client";

import { useState } from "react";
import Image from "next/image";
import { appearanceStyle, type ImageAppearance } from "@/components/product-image";
import { IconChevronLeft, IconChevronRight } from "@/components/icons";

/**
 * Product image gallery (#6): main image + previous/next navigation, thumbnails,
 * swipe and arrow-key support. Falls back to a plain single image when a product
 * only has one photo, and a placeholder when it has none.
 */
export function ProductGallery({
  images,
  alt,
  appearance,
}: {
  images: string[];
  alt: string;
  appearance?: ImageAppearance;
}) {
  const pics = images.filter(Boolean);
  const count = pics.length;
  const [i, setI] = useState(0);
  const [touchX, setTouchX] = useState<number | null>(null);
  const bg = appearance?.imageBg || "#f7f8f9";

  const at = count > 0 ? ((i % count) + count) % count : 0;
  const go = (n: number) => setI((cur) => (((cur + n) % count) + count) % count);

  if (count === 0) {
    return (
      <div
        className="relative aspect-square overflow-hidden rounded-2xl border border-line"
        style={{ background: bg }}
      >
        <Image
          src="/brand/hero.png"
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 560px"
          priority
          style={appearanceStyle(appearance)}
        />
      </div>
    );
  }

  const mainBox = (
    <div
      className="relative aspect-square overflow-hidden rounded-2xl border border-line"
      style={{ background: bg }}
      onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX == null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        setTouchX(null);
      }}
    >
      <Image
        key={pics[at]}
        src={pics[at]}
        alt={count > 1 ? `${alt} — image ${at + 1} of ${count}` : alt}
        fill
        sizes="(max-width: 768px) 100vw, 560px"
        priority
        style={appearanceStyle(appearance)}
      />
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink shadow transition hover:bg-white"
          >
            <IconChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next image"
            className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink shadow transition hover:bg-white"
          >
            <IconChevronRight className="h-5 w-5" />
          </button>
          <span className="absolute bottom-2 right-2 rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium text-white">
            {at + 1} / {count}
          </span>
        </>
      )}
    </div>
  );

  if (count === 1) return mainBox;

  return (
    <div
      className="space-y-3"
      role="group"
      aria-roledescription="carousel"
      aria-label={`${alt} images`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          go(-1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          go(1);
        }
      }}
    >
      {mainBox}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {pics.map((src, idx) => (
          <button
            key={`${src}-${idx}`}
            type="button"
            onClick={() => setI(idx)}
            aria-label={`Show image ${idx + 1}`}
            aria-current={at === idx}
            className={`relative aspect-square w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
              at === idx ? "border-accent" : "border-line hover:border-ink-soft"
            }`}
            style={{ background: bg }}
          >
            <Image src={src} alt="" fill sizes="64px" className="object-contain p-0.5" />
          </button>
        ))}
      </div>
    </div>
  );
}
