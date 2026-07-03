"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";
import { OrderStatus } from "@prisma/client";

const VALID = new Set(Object.values(OrderStatus));

export async function updateOrderStatus(id: string, formData: FormData) {
  const admin = await requireAdmin();
  const status = String(formData.get("status") ?? "");
  if (!VALID.has(status as OrderStatus)) return;

  await prisma.order.update({ where: { id }, data: { status: status as OrderStatus } });
  await audit({
    actor: admin.email,
    action: "order.status",
    target: id,
    meta: { status },
    ip: clientIp(await headers()),
  });
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
}
