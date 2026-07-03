"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface to the console; server logs capture the full stack via pino.
    console.error(error);
  }, [error]);

  return (
    <div className="container-page py-24 text-center">
      <h1 className="font-display text-3xl uppercase tracking-wide">Something went wrong</h1>
      <p className="mt-3 text-ink-soft">
        We hit an unexpected error. Please try again — if it persists, contact support.
      </p>
      <button onClick={reset} className="btn btn-primary mt-8">
        Try again
      </button>
    </div>
  );
}
