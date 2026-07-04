"use client";

import { useActionState, useState } from "react";
import type { ProductFormState } from "./actions";

type RegionOption = { slug: string; name: string };

type ProductValues = {
  slug?: string;
  name?: string;
  regionSlug?: string;
  description?: string;
  priceCents?: number;
  currency?: string;
  image?: string | null;
  stock?: number | null;
  active?: boolean;
  featured?: boolean;
};

const field =
  "mt-1 w-full rounded-xl border border-line px-4 py-2.5 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

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
  const [image, setImage] = useState(values.image ?? "");
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

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Name
          <input name="name" defaultValue={values.name} required className={field} />
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
            defaultValue={values.priceCents ?? 2000}
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
        <span className="block text-sm font-medium">Product image</span>
        <div className="mt-1 flex items-start gap-4">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-24 w-24 flex-none rounded-lg border border-line object-cover" />
          ) : (
            <div className="grid h-24 w-24 flex-none place-items-center rounded-lg border border-dashed border-line text-center text-xs text-ink-soft">
              No image
            </div>
          )}
          <div className="flex-1 space-y-2">
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
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onUpload}
                  disabled={uploading}
                />
              </label>
              {uploadError && <span className="text-sm text-danger">{uploadError}</span>}
            </div>
          </div>
        </div>
      </div>

      <label className="block text-sm font-medium">
        Description
        <textarea name="description" defaultValue={values.description} required rows={5} className={field} />
      </label>

      <label className="block text-sm font-medium">
        Stock (leave blank for unlimited / made-to-order)
        <input
          name="stock"
          type="number"
          min={0}
          defaultValue={values.stock ?? ""}
          className={field}
        />
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
    </form>
  );
}
