"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyCredentials, startSession, destroySession, requireAdmin } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";
import { logger } from "@/lib/logger";

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const ip = clientIp(await headers());
  const rl = rateLimit(`login:${ip}`, 8, 5 * 60_000);
  if (!rl.ok) {
    return { error: `Too many attempts. Try again in ${rl.retryAfterSeconds}s.` };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const admin = await verifyCredentials(parsed.data.email, parsed.data.password);
  if (!admin) {
    logger.warn({ ip, email: parsed.data.email }, "failed admin login");
    return { error: "Invalid email or password." };
  }

  await prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  await startSession(admin);
  await audit({ actor: admin.email, action: "login", ip });

  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}

export async function ensureAdmin() {
  return requireAdmin();
}
