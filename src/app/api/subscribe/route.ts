import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { subscribeSchema } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { sendSubscribeWelcome } from "@/lib/email";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Newsletter signup (#22): store subscriber, mint a one-time 5% code, email it. */
export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`subscribe:${ip}`, 5, 60_000);
  if (!rl.ok) return NextResponse.json({ ok: false, error: "Too many attempts. Please wait." }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Enter a valid email." }, { status: 400 });

  const email = parsed.data.email.toLowerCase().trim();

  try {
    const existing = await prisma.subscriber.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ ok: true, code: existing.code, already: true });

    // Mint a unique one-time 5% code.
    let code = "";
    for (let i = 0; i < 3; i++) {
      const candidate = "GC5-" + crypto.randomBytes(3).toString("hex").toUpperCase();
      try {
        await prisma.promoCode.create({
          data: { code: candidate, kind: "PERCENT", value: 5, active: true, maxRedemptions: 1 },
        });
        code = candidate;
        break;
      } catch {
        if (i === 2) throw new Error("could not generate code");
      }
    }

    const unsubToken = crypto.randomUUID();
    await prisma.subscriber.create({ data: { email, code, unsubToken, source: "popup" } });

    const unsubUrl = `${env.siteUrl}/unsubscribe?token=${unsubToken}`;
    await sendSubscribeWelcome(email, code, unsubUrl); // never throws

    return NextResponse.json({ ok: true, code });
  } catch (err) {
    logger.error({ err }, "subscribe failed");
    return NextResponse.json({ ok: false, error: "Could not subscribe. Please try again." }, { status: 500 });
  }
}
