import "server-only";

/**
 * Server-side environment access with fail-fast validation.
 * Client code must use `process.env.NEXT_PUBLIC_*` directly (statically inlined).
 */
function required(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

function optional(name: string, fallback = ""): string {
  return process.env[name]?.trim() || fallback;
}

export const env = {
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  nodeEnv: process.env.NODE_ENV || "development",
  isProd: process.env.NODE_ENV === "production",

  databaseUrl: required("DATABASE_URL"),
  authSecret: required("AUTH_SECRET"),

  stripeSecretKey: optional("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: optional("STRIPE_WEBHOOK_SECRET"),
  stripePublishableKey: optional("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),

  currency: optional("STORE_CURRENCY", "eur").toLowerCase(),
  defaultPriceCents: Number(optional("STORE_DEFAULT_PRICE_CENTS", "2000")),
  supportEmail: optional("STORE_SUPPORT_EMAIL", "globecase.mail@gmail.com"),

  geminiApiKey: optional("GEMINI_API_KEY"),
};

/** True when Stripe is configured with non-placeholder keys. */
export function isStripeLive(): boolean {
  const k = env.stripeSecretKey;
  return Boolean(k) && !k.includes("PLACEHOLDER");
}
