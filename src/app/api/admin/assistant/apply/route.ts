import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { executeAction, ALLOWED_ACTION_TYPES, type PlannedAction } from "@/lib/assistant";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Apply phase: execute the actions the owner confirmed. Whitelisted + audited. */
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
  return NextResponse.json({ results });
}
