import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isAiConfigured } from "@/lib/env";
import { callGemini } from "@/lib/gemini";
import { ASSISTANT_TOOLS, ASSISTANT_SYSTEM, catalogContext, planCall, type PlannedAction } from "@/lib/assistant";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Plan phase: turn a natural-language message into proposed (not-yet-applied) actions. */
export async function POST(req: Request) {
  await requireAdmin();
  if (!isAiConfigured()) {
    return NextResponse.json({ error: "The AI assistant isn't switched on yet." }, { status: 503 });
  }

  let body: { message?: string; attachments?: unknown; history?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const message = String(body?.message ?? "").slice(0, 2000);
  const attachments: string[] = Array.isArray(body?.attachments)
    ? body.attachments.filter((x): x is string => typeof x === "string").slice(0, 6)
    : [];
  const history = Array.isArray(body?.history) ? body.history.slice(-8) : [];
  if (!message && !attachments.length) return NextResponse.json({ error: "Say something first." }, { status: 400 });

  const system = `${ASSISTANT_SYSTEM}\n\n${await catalogContext()}${
    attachments.length ? `\n\nAttached image URLs available for set_image: ${attachments.join(", ")}` : ""
  }`;

  const contents = [
    ...history.map((h: { role?: string; text?: string }) => ({
      role: (h.role === "model" ? "model" : "user") as "model" | "user",
      parts: [{ text: String(h.text ?? "") }],
    })),
    {
      role: "user" as const,
      parts: [{ text: message + (attachments.length ? `\n[Attached images: ${attachments.join(", ")}]` : "") }],
    },
  ];

  try {
    const { text, functionCalls } = await callGemini({ system, contents, tools: ASSISTANT_TOOLS });
    const actions: PlannedAction[] = [];
    const notes: string[] = [];
    for (const fc of functionCalls) {
      const outcome = await planCall(fc, attachments);
      if (outcome.action) actions.push(outcome.action);
      else if (outcome.note) notes.push(outcome.note);
    }

    let reply = text;
    if (!reply) reply = actions.length ? "Here's what I'll do — review and press Apply:" : notes.join(" ") || "…";
    else if (notes.length) reply = `${reply}\n${notes.join(" ")}`;

    return NextResponse.json({ reply, actions });
  } catch (err) {
    logger.error({ err }, "assistant plan failed");
    return NextResponse.json({ error: "The assistant hit an error. Please try again." }, { status: 500 });
  }
}
