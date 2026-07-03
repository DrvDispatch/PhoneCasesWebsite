import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { deleteProduct } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: { region: true },
    orderBy: [{ region: { sortOrder: "asc" } }, { name: "asc" }],
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Products ({products.length})</h1>
        <Link href="/admin/products/new" className="btn btn-primary">
          + New product
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt text-left text-ink-soft">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Region</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-line-soft">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3">{p.region.name}</td>
                <td className="px-4 py-3">{formatMoney(p.priceCents, p.currency)}</td>
                <td className="px-4 py-3">{p.stock ?? "∞"}</td>
                <td className="px-4 py-3">
                  <span className={p.active ? "text-success" : "text-ink-soft"}>
                    {p.active ? "Active" : "Hidden"}
                  </span>
                  {p.featured && <span className="ml-2 text-accent">★</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/products/${p.id}/edit`} className="text-accent">
                    Edit
                  </Link>
                  <form action={deleteProduct.bind(null, p.id)} className="inline">
                    <button className="ml-3 text-danger" aria-label={`Delete ${p.name}`}>
                      Delete
                    </button>
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
