import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { isStripeLive } from "@/lib/stripe";

export const dynamic = "force-dynamic";

function Stat({ label, value, href }: { label: string; value: string; href?: string }) {
  const inner = (
    <div className="card p-5">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-2xl">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function AdminDashboard() {
  const [productCount, activeCount, paidAgg, orderCount, recentOrders, lowStock] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { active: true } }),
    prisma.order.aggregate({ _sum: { totalCents: true }, where: { status: { in: ["PAID", "FULFILLED"] } } }),
    prisma.order.count({ where: { status: { in: ["PAID", "FULFILLED"] } } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { items: true },
    }),
    prisma.product.findMany({
      where: { stock: { not: null, lte: 5 } },
      orderBy: { stock: "asc" },
      take: 8,
    }),
  ]);

  const revenue = paidAgg._sum.totalCents ?? 0;

  return (
    <div>
      <h1 className="font-display text-2xl">Dashboard</h1>

      {!isStripeLive() && (
        <div className="mt-4 rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm">
          ⚠️ Stripe is in placeholder mode. Add real keys in <code>.env</code> to accept payments.
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Revenue (paid)" value={formatMoney(revenue)} />
        <Stat label="Paid orders" value={String(orderCount)} href="/admin/orders" />
        <Stat label="Products" value={String(productCount)} href="/admin/products" />
        <Stat label="Active products" value={String(activeCount)} href="/admin/products" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-brand">
              All →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">No orders yet.</p>
          ) : (
            <table className="mt-3 w-full text-sm">
              <thead className="text-left text-ink-soft">
                <tr>
                  <th className="py-1">Order</th>
                  <th>Status</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} className="border-t border-line-soft">
                    <td className="py-2">
                      <Link href={`/admin/orders/${o.id}`} className="text-brand">
                        {o.number}
                      </Link>
                    </td>
                    <td>{o.status}</td>
                    <td className="text-right">{formatMoney(o.totalCents, o.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card p-5">
          <h2 className="font-display text-lg">Low stock</h2>
          {lowStock.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">Nothing low — made-to-order items are unlimited.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {lowStock.map((p) => (
                <li key={p.id} className="flex justify-between">
                  <Link href={`/admin/products/${p.id}/edit`} className="text-brand">
                    {p.name}
                  </Link>
                  <span className="text-danger">{p.stock} left</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
