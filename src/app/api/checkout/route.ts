import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getStripe, isStripeLive } from "@/lib/stripe";
import { checkoutSchema } from "@/lib/validation";
import { generateOrderNumber } from "@/lib/audit";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stripe requires an explicit country allow-list; this covers the store's markets.
const SHIPPING_COUNTRIES: Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] =
  ["BE", "NL", "FR", "DE", "LU", "GB", "IE", "IT", "ES", "PT", "AT", "SE", "DK", "FI", "PL", "CZ",
   "GR", "HR", "RO", "BG", "US", "CA", "AU", "CH", "NO", "TR"];

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`checkout:${ip}`, 15, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  // Validate input
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid cart." }, { status: 400 });
  }

  if (!isStripeLive()) {
    return NextResponse.json(
      { error: "Payments aren’t switched on yet. Add your Stripe keys to enable checkout." },
      { status: 503 },
    );
  }

  // Price authoritatively from the DB — never trust client prices.
  const slugs = parsed.data.items.map((i) => i.slug);
  const products = await prisma.product.findMany({ where: { slug: { in: slugs }, active: true } });
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  const orderItemsData: {
    productId: string;
    name: string;
    slug: string;
    priceCents: number;
    quantity: number;
    phoneModel: string;
  }[] = [];
  let subtotal = 0;
  let currency = env.currency;

  for (const item of parsed.data.items) {
    const product = bySlug.get(item.slug);
    if (!product) {
      return NextResponse.json({ error: `“${item.slug}” is no longer available.` }, { status: 400 });
    }
    if (product.stock !== null && product.stock < item.quantity) {
      return NextResponse.json({ error: `Not enough stock for ${product.name}.` }, { status: 400 });
    }
    currency = product.currency;
    subtotal += product.priceCents * item.quantity;
    orderItemsData.push({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      priceCents: product.priceCents,
      quantity: item.quantity,
      phoneModel: item.phoneModel || "",
    });
    lineItems.push({
      quantity: item.quantity,
      price_data: {
        currency: product.currency,
        unit_amount: product.priceCents,
        product_data: {
          name: product.name,
          description: item.phoneModel ? `Device: ${item.phoneModel}` : undefined,
          images: product.image ? [product.image] : undefined,
          metadata: { slug: product.slug },
        },
      },
    });
  }

  try {
    // Create the pending order first so the webhook can reconcile it.
    let order = null as Awaited<ReturnType<typeof prisma.order.create>> | null;
    for (let attempt = 0; attempt < 5 && !order; attempt++) {
      try {
        order = await prisma.order.create({
          data: {
            number: generateOrderNumber(),
            status: "PENDING",
            subtotalCents: subtotal,
            totalCents: subtotal, // free shipping
            currency,
            items: { create: orderItemsData },
          },
        });
      } catch (e: unknown) {
        // Retry only on unique-constraint (duplicate order number) collisions.
        if (attempt === 4) throw e;
      }
    }
    if (!order) throw new Error("Could not create order");

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${env.siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.siteUrl}/checkout/cancel`,
      shipping_address_collection: { allowed_countries: SHIPPING_COUNTRIES },
      phone_number_collection: { enabled: true },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      client_reference_id: order.id,
      metadata: { orderId: order.id, orderNumber: order.number },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    logger.info({ orderId: order.id, number: order.number, amount: subtotal }, "checkout session created");
    return NextResponse.json({ url: session.url });
  } catch (err) {
    logger.error({ err }, "checkout failed");
    return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 500 });
  }
}
