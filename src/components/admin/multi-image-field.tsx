"use client";

import { useState } from "react";

/**
 * Reusable admin image-list field: uploads append to a list of /uploads URLs,
 * serialized into a hidden input (newline-joined) for the server action.
 * Supports selecting several files at once, removing, and reordering (‹ ›).
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
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;

    const room = max - urls.length;
    if (room <= 0) {
      setErr(`Up to ${max} images.`);
      return;
    }
    const batch = files.slice(0, room);
    setErr(files.length > room ? `Only ${room} more allowed (max ${max}).` : null);

    setUploading(true);
    try {
      for (const file of batch) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const data = (await res.json()) as { url?: string; error?: string };
        if (data.url) setUrls((u) => [...u, data.url!]);
        else {
          setErr(data.error || "Upload failed");
          break;
        }
      }
    } catch {
      setErr("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function move(idx: number, dir: -1 | 1) {
    setUrls((list) => {
      const j = idx + dir;
      if (j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  }

  return (
    <div>
      <span className="block text-sm font-medium">{label}</span>
      {hint && <p className="text-xs text-ink-soft">{hint}</p>}
      <input type="hidden" name={name} value={urls.join("\n")} />
      <div className="mt-2 flex flex-wrap gap-3">
        {urls.map((u, i) => (
          <div key={`${u}-${i}`} className="group relative">
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
            {urls.length > 1 && (
              <div className="absolute inset-x-0 bottom-0 flex justify-between px-0.5 pb-0.5 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Move earlier"
                  className="grid h-5 w-5 place-items-center rounded bg-black/60 text-white disabled:opacity-30"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === urls.length - 1}
                  aria-label="Move later"
                  className="grid h-5 w-5 place-items-center rounded bg-black/60 text-white disabled:opacity-30"
                >
                  ›
                </button>
              </div>
            )}
          </div>
        ))}
        {urls.length < max && (
          <label className="grid h-20 w-20 cursor-pointer place-items-center rounded-lg border border-dashed border-line text-center text-xs text-ink-soft hover:border-accent">
            {uploading ? "…" : "+ Add"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onUpload}
              disabled={uploading}
            />
          </label>
        )}
      </div>
      {err && <p className="mt-1 text-sm text-danger">{err}</p>}
    </div>
  );
}
