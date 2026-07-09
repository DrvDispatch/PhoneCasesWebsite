"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function toggleSubscriber(id: string) {
  await requireAdmin();
  const s = await prisma.subscriber.findUnique({ where: { id } });
  if (s) await prisma.subscriber.update({ where: { id }, data: { active: !s.active } });
  revalidatePath("/admin/subscribers");
}

export async function deleteSubscriber(id: string) {
  await requireAdmin();
  await prisma.subscriber.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/subscribers");
}
