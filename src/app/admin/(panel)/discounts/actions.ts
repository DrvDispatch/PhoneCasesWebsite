"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { promoCodeSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

export type PromoFormState = { error?: string; ok?: boolean };

function emptyToNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

export async function createPromo(
  _prev: PromoFormState,
  formData: FormData,
): Promise<PromoFormState> {
  const admin = await requireAdmin();
  const parsed = promoCodeSchema.safeParse({
    code: formData.get("code"),
    kind: formData.get("kind"),
    value: formData.get("value"),
    active: formData.get("active") != null,
    minSubtotalCents: emptyToNull(formData.get("minSubtotalCents")),
    maxRedemptions: emptyToNull(formData.get("maxRedemptions")),
    expiresAt: String(formData.get("expiresAt") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const p = parsed.data;
  const code = p.code.toUpperCase();
  if (await prisma.promoCode.findUnique({ where: { code } })) {
    return { error: `Code ${code} already exists.` };
  }

  let expiresAt: Date | null = null;
  if (p.expiresAt) {
    const d = new Date(p.expiresAt);
    if (!Number.isNaN(d.getTime())) expiresAt = d;
  }

  await prisma.promoCode.create({
    data: {
      code,
      kind: p.kind,
      value: p.value,
      active: p.active,
      minSubtotalCents: p.minSubtotalCents ?? null,
      maxRedemptions: p.maxRedemptions ?? null,
      expiresAt,
    },
  });
  await audit({ actor: admin.email, action: "promo.create", target: code, ip: clientIp(await headers()) });
  revalidatePath("/admin/discounts");
  return { ok: true };
}

export async function togglePromo(id: string) {
  const admin = await requireAdmin();
  const promo = await prisma.promoCode.findUnique({ where: { id } });
  if (promo) {
    await prisma.promoCode.update({ where: { id }, data: { active: !promo.active } });
    await audit({ actor: admin.email, action: "promo.toggle", target: promo.code, ip: clientIp(await headers()) });
  }
  revalidatePath("/admin/discounts");
}

export async function deletePromo(id: string) {
  const admin = await requireAdmin();
  const promo = await prisma.promoCode.findUnique({ where: { id } });
  if (promo) {
    await prisma.promoCode.delete({ where: { id } });
    await audit({ actor: admin.email, action: "promo.delete", target: promo.code, ip: clientIp(await headers()) });
  }
  revalidatePath("/admin/discounts");
}
