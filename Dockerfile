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
# SEED_ON_DEPLOY=true (default) runs the idempotent seed after migrations.
CMD ["sh", "-c", "npx prisma migrate deploy && ([ \"$SEED_ON_DEPLOY\" = \"false\" ] || npx prisma db seed)"]

# ---- runner: tiny image that only serves the app ----
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
