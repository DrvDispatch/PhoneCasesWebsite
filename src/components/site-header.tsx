"use client";

import Link from "next/link";
import { useState } from "react";
import { MAIN_NAV, SITE } from "@/lib/site";
import { useCart } from "@/components/cart/cart-context";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { count, open: openCart } = useCart();

  return (
    <header className="sticky top-0 z-50 bg-brand text-white shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
      <div className="container-page flex min-h-16 items-center justify-between gap-6">
        <Link href="/" className="font-display text-xl font-semibold tracking-wide" aria-label={`${SITE.name} home`}>
          Globe<span className="text-accent">Case</span>
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {MAIN_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-lg px-3.5 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCart}
            className="relative rounded-lg border border-white/25 px-3 py-2 text-sm font-medium transition hover:bg-white/10"
            aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
          >
            Cart
            {count > 0 && (
              <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-xs font-bold text-white">
                {count}
              </span>
            )}
          </button>

          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-lg border border-white/25 md:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="text-lg leading-none">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {open && (
        <nav aria-label="Mobile" className="border-t border-white/10 bg-brand md:hidden">
          <ul className="container-page flex flex-col py-2">
            {MAIN_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-3 text-white/85 transition hover:bg-white/10"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
