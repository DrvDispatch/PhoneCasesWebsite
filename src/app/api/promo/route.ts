import { NextResponse } from "next/server";
import { promoLookupSchema } from "@/lib/validation";
import { findValidPromo } from "@/lib/promo";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Cart-side promo-code preview. Authoritative re-check happens at /api/checkout. */
export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`promo:${ip}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "Too many attempts. Please wait." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  const parsed = promoLookupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Enter a valid code." }, { status: 400 });
  }

  const res = await findValidPromo(parsed.data.code, parsed.data.subtotalCents);
  if (!res.ok) return NextResponse.json({ ok: false, error: res.error });

  return NextResponse.json({
    ok: true,
    code: res.promo.code,
    kind: res.promo.kind,
    value: res.promo.value,
  });
}
