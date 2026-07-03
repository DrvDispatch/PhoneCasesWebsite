"use client";

import { useActionState } from "react";
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

      <label className="block text-sm font-medium">
        Image URL
        <input name="image" type="url" defaultValue={values.image ?? ""} placeholder="https://…" className={field} />
      </label>

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
