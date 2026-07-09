import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { PromoForm } from "./promo-form";
import { deletePromo, togglePromo } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminDiscountsPage() {
  const codes = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl">Discount codes ({codes.length})</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Codes customers enter in the cart. “Buy 2 get 1 free” is automatic and needs no code.
        </p>
      </div>

      <section className="card p-5">
        <h2 className="font-display text-lg">New code</h2>
        <div className="mt-4">
          <PromoForm />
        </div>
      </section>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt text-left text-ink-soft">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Used</th>
              <th className="px-4 py-3">Min</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {codes.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-ink-soft">
                  No codes yet.
                </td>
              </tr>
            )}
            {codes.map((c) => (
              <tr key={c.id} className="border-t border-line-soft">
                <td className="px-4 py-3 font-mono font-medium">{c.code}</td>
                <td className="px-4 py-3">
                  {c.kind === "PERCENT" ? `${c.value}%` : formatMoney(c.value, "eur")}
                </td>
                <td className="px-4 py-3">
                  {c.timesRedeemed}
                  {c.maxRedemptions ? ` / ${c.maxRedemptions}` : ""}
                </td>
                <td className="px-4 py-3">{c.minSubtotalCents ? formatMoney(c.minSubtotalCents, "eur") : "—"}</td>
                <td className="px-4 py-3">
                  {c.expiresAt ? c.expiresAt.toISOString().slice(0, 10) : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={c.active ? "text-success" : "text-ink-soft"}>
                    {c.active ? "Active" : "Off"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={togglePromo.bind(null, c.id)} className="inline">
                    <button className="text-brand">{c.active ? "Disable" : "Enable"}</button>
                  </form>
                  <form action={deletePromo.bind(null, c.id)} className="inline">
                    <button className="ml-3 text-danger">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
