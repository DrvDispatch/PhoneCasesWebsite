"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** Periodically re-fetches the server component so new orders appear live. */
export function AutoRefresh({ seconds = 20 }: { seconds?: number }) {
  const router = useRouter();
  const [on, setOn] = useState(true);

  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(id);
  }, [on, seconds, router]);

  return (
    <label className="flex items-center gap-2 text-xs text-ink-soft">
      <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} />
      Auto-refresh
    </label>
  );
}
