import { SignJWT, jwtVerify, type JWTPayload } from "jose";

/**
 * Edge-safe session primitives (JWT via jose). Imported by middleware, so it
 * must NOT pull in Prisma, bcrypt, or the `server-only` env module.
 */
export const SESSION_COOKIE = "gc_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

export type SessionPayload = {
  sub: string; // admin user id
  email: string;
  role: string;
  name?: string;
};

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("globecase")
    .setAudience("globecase-admin")
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: "globecase",
      audience: "globecase-admin",
    });
    const p = payload as JWTPayload & Partial<SessionPayload>;
    if (!p.sub || !p.email || !p.role) return null;
    return { sub: p.sub, email: p.email, role: p.role, name: p.name };
  } catch {
    return null;
  }
}
