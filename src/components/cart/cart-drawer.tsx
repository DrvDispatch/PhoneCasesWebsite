"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart, lineKey } from "./cart-context";
import { formatMoney } from "@/lib/money";
import { bogoFreeCents, promoDiscountCents, type PromoLike } from "@/lib/discounts";

type AppliedPromo = PromoLike & { code: string };

export function CartDrawer() {
  const { items, isOpen, close, remove, setQuantity, subtotalCents, currency, count } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<AppliedPromo | null>(null);
  const [promoMsg, setPromoMsg] = useState<string | null>(null);
  const [promoBusy, setPromoBusy] = useState(false);

  const bogoFree = bogoFreeCents(items);
  const promoDisc = promo ? promoDiscountCents(promo, subtotalCents - bogoFree) : 0;
  const totalDiscount = Math.min(subtotalCents, bogoFree + promoDisc);
  const total = subtotalCents - totalDiscount;

  async function applyPromo() {
    if (!promoInput.trim()) return;
    setPromoBusy(true);
    setPromoMsg(null);
    try {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput.trim(), subtotalCents }),
      });
      const data = (await res.json()) as
        | { ok: true; code: string; kind: "PERCENT" | "FIXED"; value: number }
        | { ok: false; error: string };
      if (!data.ok) {
        setPromo(null);
        setPromoMsg(data.error);
        return;
      }
      setPromo({ code: data.code, kind: data.kind, value: data.value });
      setPromoMsg(null);
    } catch {
      setPromoMsg("Couldn’t check that code. Try again.");
    } finally {
      setPromoBusy(false);
    }
  }

  async function checkout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            slug: i.slug,
            quantity: i.quantity,
            phoneModel: i.phoneModel,
            phoneBrand: i.phoneBrand ?? "",
            designChoice: i.designChoice ?? "",
          })),
          promoCode: promo?.code ?? "",
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error || "Could not start checkout. Please try again.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 transition-opacity ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={close}
        aria-hidden="true"
      />

      <aside
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col bg-surface shadow-lg transition-transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-lg">Your Cart ({count})</h2>
          <button onClick={close} aria-label="Close cart" className="text-2xl leading-none text-ink-soft">
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="grid h-full place-items-center text-center text-ink-soft">
              <div>
                <p className="text-4xl">🛒</p>
                <p className="mt-3">Your cart is empty.</p>
                <Link href="/shop" onClick={close} className="btn btn-outline mt-4">
                  Browse regions
                </Link>
              </div>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => {
                const key = lineKey(item);
                const detail = [item.designChoice, item.phoneModel].filter(Boolean).join(" · ");
                return (
                  <li key={key} className="flex gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image || "/brand/hero.png"}
                      alt=""
                      className="h-16 w-16 flex-none rounded-lg border border-line bg-surface-alt object-contain p-1"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.name}</p>
                      {detail && <p className="truncate text-xs text-ink-soft">{detail}</p>}
                      <div className="mt-1 flex items-center gap-2">
                        <label className="sr-only" htmlFor={`qty-${key}`}>
                          Quantity
                        </label>
                        <select
                          id={`qty-${key}`}
                          value={item.quantity}
                          onChange={(e) => setQuantity(key, Number(e.target.value))}
                          className="rounded-md border border-line px-2 py-1 text-sm"
                        >
                          {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => remove(key)}
                          className="text-xs text-danger underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <p className="flex-none font-medium">
                      {formatMoney(item.priceCents * item.quantity, item.currency)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-line px-5 py-4">
            {/* Promo code */}
            <div className="flex gap-2">
              <input
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="Promo code"
                className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2 text-sm uppercase focus:border-accent focus:outline-none"
              />
              <button
                onClick={applyPromo}
                disabled={promoBusy || !promoInput.trim()}
                className="btn btn-outline px-4 py-2 text-sm"
              >
                {promoBusy ? "…" : "Apply"}
              </button>
            </div>
            {promoMsg && <p className="mt-1 text-xs text-danger">{promoMsg}</p>}

            <div className="mt-3 space-y-1 text-sm">
              <div className="flex items-center justify-between text-ink-soft">
                <span>Subtotal</span>
                <span>{formatMoney(subtotalCents, currency)}</span>
              </div>
              {bogoFree > 0 && (
                <div className="flex items-center justify-between text-success">
                  <span>Buy 2 get 1 free</span>
                  <span>−{formatMoney(bogoFree, currency)}</span>
                </div>
              )}
              {promo && promoDisc > 0 && (
                <div className="flex items-center justify-between text-success">
                  <span>
                    Code {promo.code}
                    <button
                      onClick={() => {
                        setPromo(null);
                        setPromoInput("");
                      }}
                      className="ml-2 text-xs text-ink-soft underline"
                    >
                      remove
                    </button>
                  </span>
                  <span>−{formatMoney(promoDisc, currency)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-ink-soft">
                <span>Shipping</span>
                <span className="font-medium text-success">Free</span>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-lg font-semibold">
              <span>Total</span>
              <span>{formatMoney(total, currency)}</span>
            </div>

            {error && <p className="mt-2 text-sm text-danger">{error}</p>}
            <button onClick={checkout} disabled={loading} className="btn btn-primary mt-3 w-full">
              {loading ? "Starting checkout…" : "Checkout securely"}
            </button>
            <p className="mt-2 text-center text-xs text-ink-soft">
              Stripe · PayPal · Klarna · 7-day returns
            </p>
          </footer>
        )}
      </aside>
    </>
  );
}
