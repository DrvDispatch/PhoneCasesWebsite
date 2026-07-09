"use client";

import { useActionState } from "react";
import { createPromo, type PromoFormState } from "./actions";

const field =
  "mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

export function PromoForm() {
  const [state, formAction, pending] = useActionState<PromoFormState, FormData>(createPromo, {});

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <label className="block text-sm font-medium">
        Code
        <input name="code" required placeholder="WELCOME5" className={field} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-medium">
          Type
          <select name="kind" defaultValue="PERCENT" className={field}>
            <option value="PERCENT">% off</option>
            <option value="FIXED">Fixed (cents)</option>
          </select>
        </label>
        <label className="block text-sm font-medium">
          Value
          <input name="value" type="number" min={1} required placeholder="5" className={field} />
        </label>
      </div>
      <label className="block text-sm font-medium">
        Min subtotal (cents, optional)
        <input name="minSubtotalCents" type="number" min={0} className={field} />
      </label>
      <label className="block text-sm font-medium">
        Max redemptions (optional)
        <input name="maxRedemptions" type="number" min={1} className={field} />
      </label>
      <label className="block text-sm font-medium">
        Expires (optional)
        <input name="expiresAt" type="date" className={field} />
      </label>
      <label className="mt-6 flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked />
        Active
      </label>

      {state.error && <p className="text-sm text-danger sm:col-span-2">{state.error}</p>}
      {state.ok && <p className="text-sm text-success sm:col-span-2">Code created.</p>}

      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className="btn btn-dark">
          {pending ? "Saving…" : "Create code"}
        </button>
      </div>
    </form>
  );
}
