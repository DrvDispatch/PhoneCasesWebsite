/**
 * SMTP smoke test for the Zoho Mail relay.
 *
 *   npm run mail:test              # verify credentials + connection only
 *   npm run mail:test you@x.com    # also send a test message to that address
 *
 * Reads SMTP_* / MAIL_FROM from .env (no dotenv dependency needed).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import nodemailer from "nodemailer";

// --- tiny .env loader (KEY="value" or KEY=value) ---
function loadEnv(file: string): Record<string, string> {
  const out: Record<string, string> = {};
  let raw = "";
  try {
    raw = readFileSync(resolve(process.cwd(), file), "utf8");
  } catch {
    return out;
  }
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

const env = { ...loadEnv(".env"), ...process.env };

const host = env.SMTP_HOST;
const port = Number(env.SMTP_PORT || "465");
const user = env.SMTP_USER;
const pass = env.SMTP_PASS;
const secure = (env.SMTP_SECURE || "true") === "true";
const from = env.MAIL_FROM || `GlobeCase <${user}>`;

if (!host || !user || !pass) {
  console.error("✗ Missing SMTP config. Need SMTP_HOST, SMTP_USER, SMTP_PASS in .env.");
  console.error(`  host=${host || "(empty)"} user=${user || "(empty)"} pass=${pass ? "(set)" : "(empty)"}`);
  process.exit(1);
}

const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });

async function main() {
  console.log(`→ Connecting to ${host}:${port} (secure=${secure}) as ${user} ...`);
  await transporter.verify();
  console.log("✓ SMTP connection + auth OK.");

  const to = process.argv[2];
  if (!to) {
    console.log("  (no recipient given — skipping test send. Pass an address to send one.)");
    return;
  }
  console.log(`→ Sending test message to ${to} ...`);
  const info = await transporter.sendMail({
    from,
    to,
    subject: "GlobeCase SMTP test ✔",
    text: "If you can read this, Zoho SMTP is working for globe-case.com.",
    html: "<p>If you can read this, <b>Zoho SMTP is working</b> for globe-case.com.</p>",
  });
  console.log(`✓ Sent. messageId=${info.messageId}`);
}

main().catch((err) => {
  console.error("✗ SMTP test failed:");
  console.error(`  ${err?.message || err}`);
  if (String(err?.message).includes("Invalid login") || err?.responseCode === 535) {
    console.error("  → 535/Invalid login usually means: use a Zoho APP-SPECIFIC password,");
    console.error("    the mailbox isn't fully provisioned yet, or SMTP access is disabled in Zoho.");
  }
  process.exit(1);
});
