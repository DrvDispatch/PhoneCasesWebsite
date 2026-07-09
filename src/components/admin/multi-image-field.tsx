"use client";

import { useState } from "react";

/**
 * Reusable admin image-list field: uploads append to a list of /uploads URLs,
 * serialized into a hidden input (newline-joined) for the server action.
 */
export function MultiImageField({
  name,
  label,
  hint,
  initial = [],
  max = 8,
}: {
  name: string;
  label: string;
  hint?: string;
  initial?: string[];
  max?: number;
}) {
  const [urls, setUrls] = useState<string[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (urls.length >= max) {
      setErr(`Up to ${max} images.`);
      return;
    }
    setUploading(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) setUrls((u) => [...u, data.url!]);
      else setErr(data.error || "Upload failed");
    } catch {
      setErr("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <span className="block text-sm font-medium">{label}</span>
      {hint && <p className="text-xs text-ink-soft">{hint}</p>}
      <input type="hidden" name={name} value={urls.join("\n")} />
      <div className="mt-2 flex flex-wrap gap-3">
        {urls.map((u, i) => (
          <div key={`${u}-${i}`} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={u}
              alt=""
              className="h-20 w-20 rounded-lg border border-line bg-surface-alt object-contain p-1"
            />
            <button
              type="button"
              onClick={() => setUrls((list) => list.filter((_, idx) => idx !== i))}
              className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-danger text-xs text-white"
              aria-label="Remove image"
            >
              ✕
            </button>
            <span className="absolute left-1 top-1 rounded bg-white/85 px-1 text-[10px] font-semibold">
              {i + 1}
            </span>
          </div>
        ))}
        {urls.length < max && (
          <label className="grid h-20 w-20 cursor-pointer place-items-center rounded-lg border border-dashed border-line text-center text-xs text-ink-soft hover:border-accent">
            {uploading ? "…" : "+ Add"}
            <input type="file" accept="image/*" className="hidden" onChange={onUpload} disabled={uploading} />
          </label>
        )}
      </div>
      {err && <p className="mt-1 text-sm text-danger">{err}</p>}
    </div>
  );
}
