import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProductForm } from "../product-form";
import { createProduct } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const regions = await prisma.region.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <Link href="/admin/products" className="text-sm text-ink-soft">
        ← Products
      </Link>
      <h1 className="mt-2 font-display text-2xl">New product</h1>
      <div className="mt-6">
        <ProductForm
          action={createProduct}
          regions={regions.map((r) => ({ slug: r.slug, name: r.name }))}
          submitLabel="Create product"
        />
      </div>
    </div>
  );
}
