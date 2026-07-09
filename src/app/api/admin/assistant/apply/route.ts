import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { executeAction, ALLOWED_ACTION_TYPES, affectsProducts, type PlannedAction } from "@/lib/assistant";
import { takeSnapshot } from "@/lib/snapshot";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Apply phase: back up, then execute the actions the owner confirmed. Audited. */
export async function POST(req: Request) {
  const admin = await requireAdmin();

  let body: { actions?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const actions: PlannedAction[] = Array.isArray(body?.actions) ? (body.actions as PlannedAction[]).slice(0, 20) : [];
  if (!actions.length) return NextResponse.json({ error: "Nothing to apply." }, { status: 400 });

  // Back up the catalogue first so any change can be undone.
  let snapshotId: string | null = null;
  if (affectsProducts(actions)) {
    try {
      snapshotId = await takeSnapshot(`Before AI: ${actions.map((a) => a.summary).join("; ").slice(0, 200)}`);
    } catch (err) {
      logger.error({ err }, "snapshot before apply failed");
    }
  }

  const results: { ok: boolean; message: string }[] = [];
  for (const action of actions) {
    if (!action || !ALLOWED_ACTION_TYPES.has(action.type)) {
      results.push({ ok: false, message: "Skipped an unrecognised action." });
      continue;
    }
    try {
      const r = await executeAction(action);
      results.push(r);
      if (r.ok) {
        await audit({
          actor: admin.email,
          action: `assistant.${action.type}`,
          meta: action.params as Record<string, unknown>,
          ip: clientIp(await headers()),
        });
      }
    } catch (err) {
      logger.error({ err, action }, "assistant apply failed");
      results.push({ ok: false, message: "That change failed." });
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
  return NextResponse.json({ results, snapshotId });
}
