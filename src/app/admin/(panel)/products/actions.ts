"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { productSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

export type ProductFormState = { error?: string; ok?: boolean };

function readForm(formData: FormData) {
  const stockRaw = String(formData.get("stock") ?? "").trim();
  return {
    slug: String(formData.get("slug") ?? "").trim().toLowerCase(),
    name: String(formData.get("name") ?? "").trim(),
    regionSlug: String(formData.get("regionSlug") ?? "").trim().toLowerCase(),
    description: String(formData.get("description") ?? "").trim(),
    priceCents: String(formData.get("priceCents") ?? ""),
    currency: String(formData.get("currency") ?? "eur").trim().toLowerCase(),
    image: String(formData.get("image") ?? "").trim(),
    stock: stockRaw === "" ? null : stockRaw,
    active: formData.get("active") != null,
    featured: formData.get("featured") != null,
  };
}

async function resolveRegionId(regionSlug: string): Promise<string | null> {
  const region = await prisma.region.findUnique({ where: { slug: regionSlug } });
  return region?.id ?? null;
}

export async function createProduct(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const admin = await requireAdmin();
  const parsed = productSchema.safeParse(readForm(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const regionId = await resolveRegionId(parsed.data.regionSlug);
  if (!regionId) return { error: `Region “${parsed.data.regionSlug}” not found.` };

  const exists = await prisma.product.findUnique({ where: { slug: parsed.data.slug } });
  if (exists) return { error: `A product with slug “${parsed.data.slug}” already exists.` };

  const p = parsed.data;
  const created = await prisma.product.create({
    data: {
      slug: p.slug,
      name: p.name,
      description: p.description,
      priceCents: p.priceCents,
      currency: p.currency,
      image: p.image || null,
      stock: p.stock ?? null,
      active: p.active,
      featured: p.featured,
      regionId,
    },
  });

  await audit({ actor: admin.email, action: "product.create", target: created.slug, ip: clientIp(await headers()) });
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  redirect("/admin/products");
}

export async function updateProduct(
  id: string,
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const admin = await requireAdmin();
  const parsed = productSchema.safeParse(readForm(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const regionId = await resolveRegionId(parsed.data.regionSlug);
  if (!regionId) return { error: `Region “${parsed.data.regionSlug}” not found.` };

  const p = parsed.data;
  await prisma.product.update({
    where: { id },
    data: {
      slug: p.slug,
      name: p.name,
      description: p.description,
      priceCents: p.priceCents,
      currency: p.currency,
      image: p.image || null,
      stock: p.stock ?? null,
      active: p.active,
      featured: p.featured,
      regionId,
    },
  });

  await audit({ actor: admin.email, action: "product.update", target: p.slug, ip: clientIp(await headers()) });
  revalidatePath("/admin/products");
  revalidatePath(`/product/${p.slug}`);
  revalidatePath("/shop");
  redirect("/admin/products");
}

export async function deleteProduct(id: string) {
  const admin = await requireAdmin();
  const product = await prisma.product.findUnique({ where: { id } });
  if (product) {
    await prisma.product.delete({ where: { id } });
    await audit({ actor: admin.email, action: "product.delete", target: product.slug, ip: clientIp(await headers()) });
  }
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  redirect("/admin/products");
}
