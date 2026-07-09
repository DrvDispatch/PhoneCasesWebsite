import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { restoreSnapshot } from "@/lib/snapshot";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Restore the product catalogue to a snapshot (used by the assistant "Undo"). */
export async function POST(req: Request) {
  const admin = await requireAdmin();
  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const id = String(body?.id ?? "");
  if (!id) return NextResponse.json({ error: "No backup id." }, { status: 400 });

  const r = await restoreSnapshot(id);
  if (!r.ok) return NextResponse.json({ error: r.error ?? "Restore failed." }, { status: 400 });

  await audit({
    actor: admin.email,
    action: "backup.restore",
    target: id,
    meta: { restored: r.restored, deleted: r.deleted },
    ip: clientIp(await headers()),
  });
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
  return NextResponse.json({ ok: true, restored: r.restored, deleted: r.deleted });
}
