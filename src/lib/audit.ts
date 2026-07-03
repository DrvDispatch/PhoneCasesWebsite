import "server-only";
import { prisma } from "./db";
import { logger } from "./logger";

/** Append an entry to the tamper-evident admin audit log (best-effort). */
export async function audit(entry: {
  actor: string;
  action: string;
  target?: string;
  meta?: Record<string, unknown>;
  ip?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actor: entry.actor,
        action: entry.action,
        target: entry.target,
        meta: entry.meta as object | undefined,
        ip: entry.ip,
      },
    });
  } catch (err) {
    logger.error({ err, entry }, "failed to write audit log");
  }
}

/** GC-XXXXXX order number (Crockford-ish, no ambiguous chars). */
export function generateOrderNumber(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `GC-${s}`;
}
