"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { reviewSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

export type ReviewFormState = { error?: string; ok?: boolean };

export async function createReview(
  _prev: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const admin = await requireAdmin();
  const parsed = reviewSchema.safeParse({
    author: formData.get("author"),
    rating: formData.get("rating"),
    body: formData.get("body"),
    productSlug: String(formData.get("productSlug") ?? "").trim() || undefined,
    imageUrl: String(formData.get("imageUrl") ?? "").trim() || undefined,
    approved: formData.get("approved") != null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const p = parsed.data;
  await prisma.review.create({
    data: {
      author: p.author,
      rating: p.rating,
      body: p.body,
      productSlug: p.productSlug || null,
      imageUrl: p.imageUrl || null,
      approved: p.approved,
    },
  });
  await audit({ actor: admin.email, action: "review.create", target: p.author, ip: clientIp(await headers()) });
  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
  revalidatePath("/");
  return { ok: true };
}

export async function toggleReview(id: string) {
  const admin = await requireAdmin();
  const review = await prisma.review.findUnique({ where: { id } });
  if (review) {
    await prisma.review.update({ where: { id }, data: { approved: !review.approved } });
    await audit({ actor: admin.email, action: "review.toggle", target: review.id, ip: clientIp(await headers()) });
  }
  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
  revalidatePath("/");
}

export async function deleteReview(id: string) {
  const admin = await requireAdmin();
  await prisma.review.delete({ where: { id } }).catch(() => {});
  await audit({ actor: admin.email, action: "review.delete", target: id, ip: clientIp(await headers()) });
  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
  revalidatePath("/");
}
