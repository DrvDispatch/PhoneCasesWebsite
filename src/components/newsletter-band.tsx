"use client";

import { useState } from "react";

/**
 * Inline "get 5% off for subscribing" band (#22) — the on-page counterpart to
 * the timed popup, placed near the bottom of the home page. Posts to the same
 * /api/subscribe endpoint, which mints a one-time 5% code and emails it.
 */
export function NewsletterBand() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [code, setCode] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMsg(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok?: boolean; code?: string; error?: string };
      if (!res.ok || !data.ok) {
        setStatus("error");
        setMsg(data.error || "Something went wrong.");
        return;
      }
      setCode(data.code ?? null);
      setStatus("done");
    } catch {
      setStatus("error");
      setMsg("Network error. Please try again.");
    }
  }

  return (
    <section aria-label="Get 5% off" className="bg-brand text-white">
      <div className="container-page max-w-2xl py-12 text-center sm:py-14">
        <p className="font-display text-xs uppercase tracking-[0.2em] text-accent">Members get more</p>
        <h2 className="mt-2 font-display text-2xl uppercase tracking-wide sm:text-3xl">
          Would you like 5% off?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/80">
          Be first to know about new drops &amp; rewards — and get{" "}
          <strong className="text-white">5% off your first order</strong> when you join.
        </p>

        {status === "done" ? (
          <div className="mx-auto mt-5 max-w-sm rounded-2xl bg-white/10 p-5">
            <p className="text-lg font-semibold">You&rsquo;re in! 🎉</p>
            {code && (
              <p className="mt-2 text-sm">
                Your code:{" "}
                <span className="rounded bg-white/20 px-2 py-1 font-mono font-bold">{code}</span>
                <br />
                <span className="text-white/70">We&rsquo;ve emailed it to you too.</span>
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={submit} className="mx-auto mt-5 flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              aria-label="Email address"
              className="w-full rounded-full bg-white px-5 py-3 text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button disabled={status === "loading"} className="btn btn-primary shrink-0 rounded-full">
              {status === "loading" ? "Sending…" : "Yes, sign me up"}
            </button>
          </form>
        )}

        {msg && <p className="mt-3 text-sm text-accent">{msg}</p>}
        <p className="mx-auto mt-3 max-w-md text-xs text-white/50">
          One-time code, single use. Unsubscribe anytime — no spam.
        </p>
      </div>
    </section>
  );
}
