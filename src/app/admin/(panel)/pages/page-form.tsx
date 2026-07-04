"use client";

import { useActionState } from "react";
import type { PageFormState } from "./actions";

type Values = { slug?: string; title?: string; body?: string; published?: boolean };

const field =
  "mt-1 w-full rounded-xl border border-line px-4 py-2.5 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

export function PageForm({
  action,
  values = {},
  submitLabel,
  lockSlug = false,
}: {
  action: (prev: PageFormState, formData: FormData) => Promise<PageFormState>;
  values?: Values;
  submitLabel: string;
  lockSlug?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="max-w-3xl space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Title
          <input name="title" defaultValue={values.title} required className={field} />
        </label>
        <label className="block text-sm font-medium">
          Slug (URL)
          <input
            name="slug"
            defaultValue={values.slug}
            required
            readOnly={lockSlug}
            pattern="[a-z0-9\-]+"
            className={`${field} ${lockSlug ? "bg-surface-alt text-ink-soft" : ""}`}
          />
        </label>
      </div>

      <label className="block text-sm font-medium">
        Content (HTML)
        <textarea name="body" defaultValue={values.body} required rows={16} className={`${field} font-mono text-sm`} />
      </label>
      <p className="-mt-3 text-xs text-ink-soft">
        Use simple HTML: &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;&lt;li&gt;, &lt;strong&gt;, &lt;a href&gt;.
      </p>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked={values.published ?? true} />
        Published (visible on the site)
      </label>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn btn-dark">
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
