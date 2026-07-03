/**
 * Lightweight in-memory sliding-window rate limiter.
 *
 * Suitable for a single-node VPS deployment (the target here). If the store is
 * ever scaled horizontally, swap the Map for Redis — the interface stays the same.
 */
type Hit = { count: number; resetAt: number };

const buckets = new Map<string, Hit>();

// Opportunistic cleanup so the Map doesn't grow unbounded.
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, hit] of buckets) {
    if (hit.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * @param key    Unique identifier (e.g. `login:1.2.3.4`).
 * @param limit  Max requests allowed per window.
 * @param windowMs Window length in milliseconds.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const hit = buckets.get(key);
  if (!hit || hit.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  hit.count += 1;
  if (hit.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((hit.resetAt - now) / 1000),
    };
  }
  return { ok: true, remaining: limit - hit.count, retryAfterSeconds: 0 };
}

/** Best-effort client IP from proxy headers (Nginx sets X-Forwarded-For). */
export function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return headers.get("x-real-ip") || "unknown";
}
