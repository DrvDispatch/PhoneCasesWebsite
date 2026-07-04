# syntax=docker/dockerfile:1
# ============================================================
# GlobeCase — multi-stage production image
# ============================================================

FROM node:20-alpine AS base
# Prisma needs OpenSSL at build & runtime on Alpine.
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---- deps: install all deps (postinstall runs `prisma generate`) ----
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

# ---- builder: compile the Next standalone bundle ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# A dummy DATABASE_URL is fine: all data pages are force-dynamic, so the build
# never touches the database.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV AUTH_SECRET="build-time-placeholder"
RUN npm run build

# ---- migrator: full toolchain to run `migrate deploy` + seed at deploy time ----
FROM builder AS migrator
# Always applies migrations + the idempotent essentials seed (admin/pages/reviews);
# the catalog re-sync inside is self-gated by SEED_ON_DEPLOY.
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed"]

# ---- runner: tiny image that only serves the app ----
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
# Bind to all interfaces so the in-container healthcheck (localhost:3000) passes.
# Without this, Next standalone binds to the container hostname → healthcheck "unhealthy".
ENV HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Writable dir for admin image uploads (backed by a Docker volume).
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
