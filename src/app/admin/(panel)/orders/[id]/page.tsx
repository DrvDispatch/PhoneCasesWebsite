import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { updateOrderStatus, fulfillOrder, resendConfirmation, saveOrderNote } from "../actions";
import { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function AddressBlock({ address }: { address: unknown }) {
  if (!address || typeof address !== "object") return <p className="text-ink-soft">—</p>;
  const a = address as Record<string, unknown>;
  const addr = (a.address as Record<string, unknown>) ?? a;
  const line = [addr.line1, addr.line2, addr.postal_code, addr.city, addr.state, addr.country]
    .filter(Boolean)
    .join(", ");
  return (
    <p className="text-ink">
      {(a.name as string) ? `${a.name} — ` : ""}
      {line || "—"}
    </p>
  );
}

export default async function OrderDetailPage({ params }: Params) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();

  return (
    <div>
      <Link href="/admin/orders" className="text-sm text-ink-soft">
        ← Orders
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl">Order {order.number}</h1>
        <span className="rounded-full bg-surface px-3 py-1 text-sm">{order.status}</span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <h2 className="font-display text-lg">Items</h2>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {order.items.map((it) => (
                <tr key={it.id} className="border-t border-line-soft align-top">
                  <td className="py-2">
                    {it.name}
                    {(it.phoneBrand || it.phoneModel) && (
                      <span className="block text-xs text-ink-soft">
                        Device: {[it.phoneBrand, it.phoneModel].filter(Boolean).join(" ")}
                      </span>
                    )}
                    {it.designChoice && (
                      <span className="block text-xs font-medium text-brand">{it.designChoice}</span>
                    )}
                  </td>
                  <td className="py-2 text-center">× {it.quantity}</td>
                  <td className="py-2 text-right">
                    {formatMoney(it.priceCents * it.quantity, order.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
            <div className="flex justify-between text-ink-soft">
              <span>Subtotal</span>
              <span>{formatMoney(order.subtotalCents, order.currency)}</span>
            </div>
            {order.discountCents > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount {order.promoCode ? `(${order.promoCode})` : ""}</span>
                <span>−{formatMoney(order.discountCents, order.currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <span>Total (free shipping)</span>
              <span>{formatMoney(order.totalCents, order.currency)}</span>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="card p-5">
            <h2 className="font-display text-lg">Customer</h2>
            <p className="mt-2 text-sm text-ink-soft">Email</p>
            <p>{order.email ?? "—"}</p>
            <p className="mt-2 text-sm text-ink-soft">Ship to</p>
            <AddressBlock address={order.shippingAddress} />
          </section>

          <section className="card p-5">
            <h2 className="font-display text-lg">Update status</h2>
            <form action={updateOrderStatus.bind(null, order.id)} className="mt-3 flex gap-2">
              <select name="status" defaultValue={order.status} className="rounded-lg border border-line px-3 py-2 text-sm">
                {Object.values(OrderStatus).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button className="btn btn-dark">Save</button>
            </form>
            {order.paidAt && (
              <p className="mt-3 text-xs text-ink-soft">
                Paid {order.paidAt.toISOString().slice(0, 16).replace("T", " ")}
              </p>
            )}
            {order.stripePaymentIntentId && (
              <p className="mt-1 break-all text-xs text-ink-soft">PI: {order.stripePaymentIntentId}</p>
            )}
          </section>

          <section className="card p-5">
            <h2 className="font-display text-lg">Fulfillment</h2>
            <form action={fulfillOrder.bind(null, order.id)} className="mt-3 space-y-2 text-sm">
              <input
                name="carrier"
                defaultValue={order.carrier ?? ""}
                placeholder="Carrier (e.g. PostNL, DHL)"
                className="w-full rounded-lg border border-line px-3 py-2"
              />
              <input
                name="trackingNumber"
                defaultValue={order.trackingNumber ?? ""}
                placeholder="Tracking number"
                className="w-full rounded-lg border border-line px-3 py-2"
              />
              <input
                name="trackingUrl"
                type="url"
                defaultValue={order.trackingUrl ?? ""}
                placeholder="Tracking URL (optional)"
                className="w-full rounded-lg border border-line px-3 py-2"
              />
              <label className="flex items-center gap-2">
                <input type="checkbox" name="notify" defaultChecked />
                Email the customer that it shipped
              </label>
              <button className="btn btn-primary w-full">Save &amp; mark shipped</button>
            </form>
            {order.fulfilledAt && (
              <p className="mt-2 text-xs text-ink-soft">
                Shipped {order.fulfilledAt.toISOString().slice(0, 16).replace("T", " ")}
              </p>
            )}
            <form action={resendConfirmation.bind(null, order.id)} className="mt-3">
              <button className="text-sm text-brand underline">Resend confirmation email</button>
            </form>
          </section>

          <section className="card p-5">
            <h2 className="font-display text-lg">Internal note</h2>
            <form action={saveOrderNote.bind(null, order.id)} className="mt-3 space-y-2">
              <textarea
                name="notes"
                defaultValue={order.notes ?? ""}
                rows={3}
                placeholder="Private note (not shown to customer)"
                className="w-full rounded-lg border border-line px-3 py-2 text-sm"
              />
              <button className="btn btn-outline w-full text-sm">Save note</button>
            </form>
          </section>
        </aside>
      </div>
    </div>
  );
}
