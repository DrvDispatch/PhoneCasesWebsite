"use client";

import { useActionState } from "react";
import { applyBulkDescription, type BulkState } from "./actions";

export function BulkDescriptionForm() {
  const [state, formAction, pending] = useActionState<BulkState, FormData>(applyBulkDescription, {});

  return (
    <form action={formAction} className="space-y-2">
      <textarea
        name="template"
        rows={4}
        required
        placeholder={"Wear your roots. The {country} Phone Case is a premium, culturally inspired design celebrating {country} — printed edge to edge on a slim, shock-absorbing case. Made to order for any iPhone or Samsung. Worldwide free shipping, 7-day returns."}
        className="w-full rounded-xl border border-line px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
      />
      <p className="text-xs text-ink-soft">
        Use <code className="rounded bg-surface-alt px-1">{"{country}"}</code> for the country name.
        This overwrites the description of <strong>every</strong> product.
      </p>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.ok && <p className="text-sm text-success">Updated {state.count} products.</p>}
      <button type="submit" disabled={pending} className="btn btn-outline text-sm">
        {pending ? "Applying…" : "Apply to all products"}
      </button>
    </form>
  );
}
