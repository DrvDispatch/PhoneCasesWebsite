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
  supportEmail: optional("STORE_SUPPORT_EMAIL", "support@globe-case.com"),

  // --- Email (SMTP relay) ---
  smtpHost: optional("SMTP_HOST"),
  smtpPort: Number(optional("SMTP_PORT", "587")),
  smtpUser: optional("SMTP_USER"),
  smtpPass: optional("SMTP_PASS"),
  smtpSecure: optional("SMTP_SECURE", "false") === "true",
  mailFrom: optional("MAIL_FROM", "GlobeCase <orders@globe-case.com>"),
  ownerEmail: optional("OWNER_EMAIL"),

  geminiApiKey: optional("GEMINI_API_KEY"),

  // --- AI assistant (Vertex AI / Gemini via service account) ---
  gcpProject: optional("GCP_PROJECT_ID"),
  gcpLocation: optional("GCP_LOCATION", "us-central1"),
  gcpModel: optional("GCP_MODEL", "gemini-2.5-flash"),
  googleCredentials: optional("GOOGLE_APPLICATION_CREDENTIALS"),
};

/** True when the Vertex AI assistant is configured (project + credentials). */
export function isAiConfigured(): boolean {
  return Boolean(env.gcpProject && env.googleCredentials);
}

/** True when SMTP relay credentials are present. */
export function isEmailConfigured(): boolean {
  return Boolean(env.smtpHost && env.smtpUser && env.smtpPass);
}

/** True when Stripe is configured with non-placeholder keys. */
export function isStripeLive(): boolean {
  const k = env.stripeSecretKey;
  return Boolean(k) && !k.includes("PLACEHOLDER");
}
