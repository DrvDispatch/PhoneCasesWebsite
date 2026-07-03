import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ClearCart } from "@/components/cart/clear-cart";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

type Search = { searchParams: Promise<{ session_id?: string }> };

export default async function SuccessPage({ searchParams }: Search) {
  const { session_id } = await searchParams;

  const order = session_id
    ? await prisma.order.findUnique({
        where: { stripeSessionId: session_id },
        include: { items: true },
      })
    : null;

  return (
    <div className="container-page py-20">
      <ClearCart />
      <div className="mx-auto max-w-lg text-center">
        <p className="text-5xl">✅</p>
        <h1 className="mt-4 font-display text-3xl uppercase tracking-wide">Thank you!</h1>
        <p className="mt-3 text-ink-soft">
          Your order has been received. A confirmation email is on its way. We&apos;ll print your
          case to order and ship it worldwide — free.
        </p>

        {order && (
          <div className="mt-6 rounded-2xl border border-line p-6 text-left">
            <p className="text-sm text-ink-soft">Order</p>
            <p className="font-display text-xl">{order.number}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {order.items.map((it) => (
                <li key={it.id} className="flex justify-between">
                  <span>
                    {it.name}
                    {it.phoneModel ? ` — ${it.phoneModel}` : ""} × {it.quantity}
                  </span>
                  <span>{formatMoney(it.priceCents * it.quantity, order.currency)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between border-t border-line pt-3 font-semibold">
              <span>Total</span>
              <span>{formatMoney(order.totalCents, order.currency)}</span>
            </div>
          </div>
        )}

        <Link href="/shop" className="btn btn-primary mt-8">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
