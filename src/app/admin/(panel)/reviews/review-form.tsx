"use client";

import { useActionState, useState } from "react";
import { createReview, type ReviewFormState } from "./actions";

const field =
  "mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

export function ReviewForm() {
  const [state, formAction, pending] = useActionState<ReviewFormState, FormData>(createReview, {});
  const [image, setImage] = useState("");
  const [uploading, setUploading] = useState(false);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string };
      if (data.url) setImage(data.url);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <label className="block text-sm font-medium">
        Author
        <input name="author" required placeholder="Sarah K." className={field} />
      </label>
      <label className="block text-sm font-medium">
        Rating
        <select name="rating" defaultValue="5" className={field}>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {"★".repeat(n)} ({n})
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium sm:col-span-2">
        Review
        <textarea name="body" required rows={3} placeholder="Amazing quality, fast shipping…" className={field} />
      </label>
      <label className="block text-sm font-medium">
        Product slug (optional)
        <input name="productSlug" placeholder="chechnya" className={field} />
      </label>
      <div className="block text-sm font-medium">
        Photo (optional — e.g. Google review)
        <div className="mt-1 flex items-center gap-2">
          <input name="imageUrl" value={image} onChange={(e) => setImage(e.target.value)} placeholder="/uploads/… or https://…" className={field} />
          <label className="btn btn-outline cursor-pointer whitespace-nowrap text-xs">
            {uploading ? "…" : "Upload"}
            <input type="file" accept="image/*" className="hidden" onChange={onUpload} disabled={uploading} />
          </label>
        </div>
      </div>
      <label className="mt-6 flex items-center gap-2 text-sm">
        <input type="checkbox" name="approved" defaultChecked />
        Approved (shown on site)
      </label>

      {state.error && <p className="text-sm text-danger sm:col-span-2">{state.error}</p>}
      {state.ok && <p className="text-sm text-success sm:col-span-2">Review added.</p>}

      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className="btn btn-dark">
          {pending ? "Saving…" : "Add review"}
        </button>
      </div>
    </form>
  );
}
