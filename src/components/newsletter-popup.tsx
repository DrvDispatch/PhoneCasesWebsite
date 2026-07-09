"use client";

import { useEffect, useState } from "react";

const KEY = "globecase.newsletter.v1";

export function NewsletterPopup() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [code, setCode] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY)) return;
    } catch {
      return;
    }
    const t = setTimeout(() => setShow(true), 7000);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
  }

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
      try {
        localStorage.setItem(KEY, "1");
      } catch {
        /* ignore */
      }
    } catch {
      setStatus("error");
      setMsg("Network error. Please try again.");
    }
  }

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Get 5% off"
    >
      <div className="absolute inset-0 bg-black/40" onClick={dismiss} aria-hidden="true" />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-surface shadow-lg">
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-3 top-3 text-xl leading-none text-white/80 hover:text-white"
        >
          ✕
        </button>
        <div className="bg-brand px-6 py-6 text-white">
          <p className="font-display text-2xl">Get 5% off your first order</p>
          <p className="mt-1 text-sm text-white/80">
            Join our list for a code + early access to new designs.
          </p>
        </div>
        <div className="p-6">
          {status === "done" ? (
            <div className="text-center">
              <p className="text-lg font-semibold text-brand">You&rsquo;re in! 🎉</p>
              {code && (
                <p className="mt-2 text-sm">
                  Your code:{" "}
                  <span className="rounded bg-surface-alt px-2 py-1 font-mono font-bold">{code}</span>
                  <br />
                  <span className="text-ink-soft">We&rsquo;ve emailed it to you too.</span>
                </p>
              )}
              <button onClick={dismiss} className="btn btn-primary mt-4 w-full">
                Start shopping
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full rounded-xl border border-line px-4 py-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
              {msg && <p className="text-sm text-danger">{msg}</p>}
              <button disabled={status === "loading"} className="btn btn-primary w-full">
                {status === "loading" ? "Sending…" : "Get my 5% code"}
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="w-full text-center text-xs text-ink-soft underline"
              >
                No thanks
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
