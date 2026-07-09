"use client";

import { useActionState, useState } from "react";
import type { ProductFormState } from "./actions";
import { MultiImageField } from "@/components/admin/multi-image-field";

type RegionOption = { slug: string; name: string };

type ProductValues = {
  slug?: string;
  name?: string;
  regionSlug?: string;
  description?: string;
  priceCents?: number;
  currency?: string;
  image?: string | null;
  gallery?: string[];
  designImages?: string[];
  imageFit?: string;
  imageScale?: number;
  imageBg?: string;
  stock?: number | null;
  active?: boolean;
  featured?: boolean;
};

const field =
  "mt-1 w-full rounded-xl border border-line px-4 py-2.5 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

const BG_SWATCHES = ["#f7f8f9", "#ffffff", "#1a3c34", "#0f2a23", "#111827", "#e8ded0"];

export function ProductForm({
  action,
  regions,
  values = {},
  submitLabel,
}: {
  action: (prev: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  regions: RegionOption[];
  values?: ProductValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [country, setCountry] = useState((values.name ?? "").replace(/\s*Phone Case\s*$/i, ""));
  const [price, setPrice] = useState(String(values.priceCents ?? 2000));
  const [image, setImage] = useState(values.image ?? "");
  const [fit, setFit] = useState(values.imageFit ?? "contain");
  const [scale, setScale] = useState(values.imageScale ?? 100);
  const [bg, setBg] = useState(values.imageBg ?? "#f7f8f9");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) setUploadError(data.error || "Upload failed");
      else setImage(data.url);
    } catch {
      setUploadError("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const previewStyle: React.CSSProperties = {
    objectFit: fit === "cover" ? "cover" : "contain",
    transform: `scale(${Math.max(40, Math.min(200, scale)) / 100})`,
  };
  const previewSrc = image || "/brand/hero.png";
  const title = country.trim() ? `${country.trim()} Phone Case` : "Product name";
  const priceLabel = `€${((Number(price) || 0) / 100).toFixed(2)}`;

  return (
    <form action={formAction} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      {/* ---------- Fields ---------- */}
      <div className="order-2 space-y-5 lg:order-1">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Country / name
            <div className="mt-1 flex items-stretch">
              <input
                name="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
                placeholder="Chechnya"
                className="w-full rounded-l-xl border border-r-0 border-line px-4 py-2.5 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
              <span className="inline-flex items-center whitespace-nowrap rounded-r-xl border border-line bg-surface-alt px-3 text-sm text-ink-soft">
                Phone Case
              </span>
            </div>
          </label>
          <label className="block text-sm font-medium">
            Slug (URL)
            <input
              name="slug"
              defaultValue={values.slug}
              required
              pattern="[a-z0-9\-]+"
              title="lowercase letters, numbers and hyphens"
              className={field}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-medium">
            Region
            <select name="regionSlug" defaultValue={values.regionSlug ?? regions[0]?.slug} className={field}>
              {regions.map((r) => (
                <option key={r.slug} value={r.slug}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Price (cents)
            <input
              name="priceCents"
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className={field}
            />
          </label>
          <label className="block text-sm font-medium">
            Currency
            <input name="currency" defaultValue={values.currency ?? "eur"} className={field} />
          </label>
        </div>

        <div>
          <span className="block text-sm font-medium">Main image</span>
          <div className="mt-1 space-y-2">
            <input
              name="image"
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="/uploads/… or https://…"
              className={field}
            />
            <div className="flex items-center gap-3">
              <label className="btn btn-outline cursor-pointer text-sm">
                {uploading ? "Uploading…" : "Upload image"}
                <input type="file" accept="image/*" className="hidden" onChange={onUpload} disabled={uploading} />
              </label>
              {uploadError && <span className="text-sm text-danger">{uploadError}</span>}
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="rounded-xl border border-line p-4">
          <p className="text-sm font-medium">Image appearance</p>
          <p className="text-xs text-ink-soft">How this product&rsquo;s photo is shown — see the live preview.</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Fit
              <select name="imageFit" value={fit} onChange={(e) => setFit(e.target.value)} className={field}>
                <option value="contain">Contain — show the whole image</option>
                <option value="cover">Cover — fill &amp; crop edges</option>
              </select>
            </label>
            <label className="block text-sm font-medium">
              Zoom <span className="font-normal text-ink-soft">({scale}%)</span>
              <input
                name="imageScale"
                type="range"
                min={50}
                max={160}
                step={5}
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="mt-3 w-full accent-accent"
              />
            </label>
          </div>
          <div className="mt-3">
            <span className="block text-sm font-medium">Background</span>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <input
                name="imageBg"
                type="color"
                value={bg}
                onChange={(e) => setBg(e.target.value)}
                className="h-9 w-12 rounded border border-line"
                aria-label="Background colour"
              />
              {BG_SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setBg(c)}
                  aria-label={`Use ${c}`}
                  className="h-7 w-7 rounded-full border border-line"
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <MultiImageField
          name="designImages"
          label="Design options (customer picks one)"
          hint="Up to 3 designs shown as thumbnails above the quantity, recorded on the order as Design 1/2/3."
          initial={values.designImages ?? []}
          max={3}
        />

        <MultiImageField
          name="gallery"
          label="Gallery photos (extra images)"
          hint="Optional additional product photos."
          initial={values.gallery ?? []}
          max={8}
        />

        <label className="block text-sm font-medium">
          Description
          <textarea name="description" defaultValue={values.description} required rows={5} className={field} />
        </label>

        <label className="block text-sm font-medium">
          Stock (leave blank for unlimited / made-to-order)
          <input name="stock" type="number" min={0} defaultValue={values.stock ?? ""} className={field} />
        </label>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={values.active ?? true} />
            Active (visible in store)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="featured" defaultChecked={values.featured ?? false} />
            Featured (bestseller)
          </label>
        </div>

        {state.error && <p className="text-sm text-danger">{state.error}</p>}

        <button type="submit" disabled={pending} className="btn btn-dark">
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>

      {/* ---------- Live preview ---------- */}
      <aside className="order-1 lg:order-2">
        <div className="space-y-4 rounded-2xl border border-line bg-surface p-4 lg:sticky lg:top-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Live preview</p>

          <div>
            <p className="mb-1 text-xs text-ink-soft">Shop card</p>
            <div className="mx-auto w-44 overflow-hidden rounded-xl border border-line">
              <div className="relative aspect-square overflow-hidden" style={{ background: bg }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewSrc} alt="" className="absolute inset-0 h-full w-full" style={previewStyle} />
              </div>
              <div className="p-3">
                <p className="truncate font-display text-sm">{title}</p>
                <p className="mt-1 text-sm font-semibold text-brand">{priceLabel}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs text-ink-soft">Product page</p>
            <div
              className="relative aspect-square overflow-hidden rounded-xl border border-line"
              style={{ background: bg }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewSrc} alt="" className="absolute inset-0 h-full w-full" style={previewStyle} />
            </div>
          </div>
        </div>
      </aside>
    </form>
  );
}
