"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Result = { slug: string; name: string; regionName: string };

export function CountrySearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: ctrl.signal,
        });
        if (res.ok) {
          setResults((await res.json()) as Result[]);
          setOpen(true);
        }
      } catch {
        /* aborted */
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <div ref={boxRef} className="relative">
      <div className="flex gap-2">
        <label htmlFor="country-search" className="sr-only">
          Search for your country
        </label>
        <input
          id="country-search"
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder="Type a country… (e.g. Serbia, Japan, Egypt)"
          autoComplete="off"
          className="w-full rounded-xl border border-line px-4 py-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </div>

      {open && results.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-line bg-surface shadow-md"
        >
          {results.map((r) => (
            <li key={r.slug}>
              <Link
                href={`/product/${r.slug}`}
                className="flex items-center justify-between px-4 py-3 text-sm transition hover:bg-surface-alt"
                onClick={() => setOpen(false)}
              >
                <span className="font-medium">{r.name}</span>
                <span className="text-xs uppercase tracking-wide text-ink-soft">{r.regionName}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {open && q.trim() && results.length === 0 && (
        <div className="absolute z-20 mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink-soft shadow-md">
          No match yet — try another spelling, or{" "}
          <Link href="/shop" className="text-accent underline">
            browse all regions
          </Link>
          .
        </div>
      )}
    </div>
  );
}
