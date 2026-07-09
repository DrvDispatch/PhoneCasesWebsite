import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getStripe, isStripeLive } from "@/lib/stripe";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { sendOrderEmails } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe webhook. The raw request body is required for signature verification,
 * so we read req.text() and never parse it first.
 */
export async function POST(req: Request) {
  if (!isStripeLive() || !env.stripeWebhookSecret || env.stripeWebhookSecret.includes("PLACEHOLDER")) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const raw = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, env.stripeWebhookSecret);
  } catch (err) {
    logger.warn({ err }, "invalid stripe webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await fulfillOrder(session);
    } else if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      await prisma.order.updateMany({
        where: { stripeSessionId: session.id, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
    }
  } catch (err) {
    logger.error({ err, type: event.type }, "webhook handler failed");
    // 500 => Stripe retries later.
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function fulfillOrder(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  const order = orderId
    ? await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } })
    : await prisma.order.findUnique({ where: { stripeSessionId: session.id }, include: { items: true } });

  if (!order) {
    logger.warn({ sessionId: session.id }, "webhook: no matching order");
    return;
  }
  if (order.status === "PAID" || order.status === "FULFILLED") return; // idempotent

  const shipping = (session.collected_information as { shipping_details?: unknown })?.shipping_details ??
    session.customer_details ?? null;

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        email: session.customer_details?.email ?? order.email,
        customerName: session.customer_details?.name ?? order.customerName,
        shippingAddress: shipping as object,
        stripePaymentIntentId:
          typeof session.payment_intent === "string" ? session.payment_intent : undefined,
        totalCents: session.amount_total ?? order.totalCents,
      },
    });

    // Decrement inventory for products that track stock.
    for (const item of order.items) {
      if (!item.productId) continue;
      await tx.product.updateMany({
        where: { id: item.productId, stock: { not: null } },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // Count a promo redemption only once payment is confirmed.
    if (order.promoCode) {
      await tx.promoCode.updateMany({
        where: { code: order.promoCode },
        data: { timesRedeemed: { increment: 1 } },
      });
    }
  });

  logger.info({ orderId: order.id, number: order.number }, "order paid");

  // Transactional emails: confirm to customer + alert the owner. Never throws.
  await sendOrderEmails({
    number: order.number,
    email: session.customer_details?.email ?? order.email,
    customerName: session.customer_details?.name ?? order.customerName,
    currency: order.currency,
    totalCents: session.amount_total ?? order.totalCents,
    items: order.items.map((i) => ({
      name: i.name,
      phoneModel: [i.designChoice, i.phoneModel].filter(Boolean).join(" · ") || i.phoneModel,
      quantity: i.quantity,
      priceCents: i.priceCents,
    })),
    shippingAddress: shipping,
  });
}
