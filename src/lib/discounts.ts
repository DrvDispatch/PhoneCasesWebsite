/**
 * Pure discount math — safe to use on both the client (cart display) and the
 * server (authoritative checkout total). No DB / server-only imports.
 */

export type DiscountLineItem = { priceCents: number; quantity: number };

/**
 * Cart-wide "Buy 2, get 1 free" (#17): every 3rd unit across the whole cart is
 * free, and the cheapest units are the ones made free. Returns the value (cents)
 * to subtract. With a flat price this is simply floor(totalUnits / 3) * price.
 */
export function bogoFreeCents(items: DiscountLineItem[]): number {
  const units: number[] = [];
  for (const it of items) {
    for (let i = 0; i < it.quantity; i++) units.push(it.priceCents);
  }
  const freeCount = Math.floor(units.length / 3);
  if (freeCount <= 0) return 0;
  units.sort((a, b) => a - b);
  let free = 0;
  for (let i = 0; i < freeCount; i++) free += units[i];
  return free;
}

export type PromoLike = { kind: "PERCENT" | "FIXED"; value: number };

/** Discount from a promo code applied to a base amount (after BOGO). */
export function promoDiscountCents(promo: PromoLike, baseCents: number): number {
  if (baseCents <= 0) return 0;
  if (promo.kind === "PERCENT") {
    const pct = Math.max(0, Math.min(100, promo.value));
    return Math.round((baseCents * pct) / 100);
  }
  return Math.min(baseCents, Math.max(0, promo.value));
}
