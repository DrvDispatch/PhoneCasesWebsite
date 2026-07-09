import "server-only";
import { prisma } from "./db";

/**
 * Server-side validation of a promo code against the live subtotal.
 * Used by both /api/promo (cart preview) and /api/checkout (authoritative).
 */
export async function findValidPromo(codeRaw: string, subtotalCents: number) {
  const code = codeRaw.trim().toUpperCase();
  if (!code) return { ok: false as const, error: "Enter a code." };

  const promo = await prisma.promoCode.findUnique({ where: { code } });
  if (!promo || !promo.active) {
    return { ok: false as const, error: "That code isn’t valid." };
  }
  if (promo.expiresAt && promo.expiresAt.getTime() < Date.now()) {
    return { ok: false as const, error: "That code has expired." };
  }
  if (promo.maxRedemptions !== null && promo.timesRedeemed >= promo.maxRedemptions) {
    return { ok: false as const, error: "That code has reached its limit." };
  }
  if (promo.minSubtotalCents !== null && subtotalCents < promo.minSubtotalCents) {
    return { ok: false as const, error: "Your cart doesn’t meet this code’s minimum." };
  }
  return { ok: true as const, promo };
}
