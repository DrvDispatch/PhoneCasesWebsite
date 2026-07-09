"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { takeSnapshot, restoreSnapshot } from "@/lib/snapshot";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

export async function backupNow() {
  const admin = await requireAdmin();
  const id = await takeSnapshot("Manual backup");
  await audit({ actor: admin.email, action: "backup.create", target: id, ip: clientIp(await headers()) });
  revalidatePath("/admin/backups");
}

export async function restoreAction(id: string) {
  const admin = await requireAdmin();
  const r = await restoreSnapshot(id);
  await audit({
    actor: admin.email,
    action: "backup.restore",
    target: id,
    meta: { restored: r.restored, deleted: r.deleted },
    ip: clientIp(await headers()),
  });
  revalidatePath("/admin/backups");
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
}
