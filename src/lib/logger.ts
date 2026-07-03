import pino from "pino";

/**
 * Structured JSON logger. In production this emits one JSON object per line —
 * ready for `docker logs`, journald, or a log shipper. Secrets are redacted.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.passwordHash",
      "*.token",
      "*.secret",
    ],
    censor: "[redacted]",
  },
  base: { service: "globecase" },
});
