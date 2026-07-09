import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductForm } from "../../product-form";
import { updateProduct, deleteProduct } from "../../actions";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Params) {
  const { id } = await params;
  const [product, regions] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { region: true } }),
    prisma.region.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!product) notFound();

  return (
    <div>
      <Link href="/admin/products" className="text-sm text-ink-soft">
        ← Products
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="font-display text-2xl">Edit: {product.name}</h1>
        <form action={deleteProduct.bind(null, product.id)}>
          <button className="text-sm text-danger">Delete</button>
        </form>
      </div>

      <div className="mt-6">
        <ProductForm
          action={updateProduct.bind(null, product.id)}
          regions={regions.map((r) => ({ slug: r.slug, name: r.name }))}
          values={{
            slug: product.slug,
            name: product.name,
            regionSlug: product.region.slug,
            description: product.description,
            priceCents: product.priceCents,
            currency: product.currency,
            image: product.image,
            gallery: product.gallery,
            designImages: product.designImages,
            stock: product.stock,
            active: product.active,
            featured: product.featured,
          }}
          submitLabel="Save changes"
        />
      </div>
    </div>
  );
}
