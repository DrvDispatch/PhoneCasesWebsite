import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  signSession,
  verifySession,
  type SessionPayload,
} from "./session";

/** Verify an email/password pair against the AdminUser table. */
export async function verifyCredentials(email: string, password: string) {
  const admin = await prisma.adminUser.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (!admin) {
    // Constant-ish work to blunt user-enumeration timing.
    await bcrypt.compare(password, "$2a$12$0000000000000000000000000000000000000000000000000000");
    return null;
  }
  const ok = await bcrypt.compare(password, admin.passwordHash);
  return ok ? admin : null;
}

/** Issue the session cookie for a logged-in admin. */
export async function startSession(admin: {
  id: string;
  email: string;
  role: string;
  name?: string | null;
}) {
  const token = await signSession({
    sub: admin.id,
    email: admin.email,
    role: admin.role,
    name: admin.name ?? undefined,
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** Current admin session (or null) from the request cookies. */
export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value);
}

/** Guard for server components/actions: redirect to login if not authed. */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}
