"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { pageSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

export type PageFormState = { error?: string };

function read(formData: FormData) {
  return {
    slug: String(formData.get("slug") ?? "").trim().toLowerCase(),
    title: String(formData.get("title") ?? "").trim(),
    body: String(formData.get("body") ?? ""),
    published: formData.get("published") != null,
  };
}

export async function createPage(_prev: PageFormState, formData: FormData): Promise<PageFormState> {
  const admin = await requireAdmin();
  const parsed = pageSchema.safeParse(read(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  if (await prisma.page.findUnique({ where: { slug: parsed.data.slug } })) {
    return { error: `A page with slug “${parsed.data.slug}” already exists.` };
  }
  await prisma.page.create({ data: parsed.data });
  await audit({ actor: admin.email, action: "page.create", target: parsed.data.slug, ip: clientIp(await headers()) });
  revalidatePath("/admin/pages");
  redirect("/admin/pages");
}

export async function updatePage(
  id: string,
  _prev: PageFormState,
  formData: FormData,
): Promise<PageFormState> {
  const admin = await requireAdmin();
  const parsed = pageSchema.safeParse(read(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  await prisma.page.update({ where: { id }, data: parsed.data });
  await audit({ actor: admin.email, action: "page.update", target: parsed.data.slug, ip: clientIp(await headers()) });
  revalidatePath("/admin/pages");
  revalidatePath(`/${parsed.data.slug}`);
  revalidatePath(`/p/${parsed.data.slug}`);
  redirect("/admin/pages");
}

export async function deletePage(id: string) {
  const admin = await requireAdmin();
  const page = await prisma.page.findUnique({ where: { id } });
  if (page) {
    await prisma.page.delete({ where: { id } });
    await audit({ actor: admin.email, action: "page.delete", target: page.slug, ip: clientIp(await headers()) });
  }
  revalidatePath("/admin/pages");
  redirect("/admin/pages");
}
