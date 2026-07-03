# GlobeCase — E-commerce Store

Culturally inspired phone cases, organised by world region. A full-stack,
production-grade store: server-rendered storefront, Stripe checkout, an
authenticated admin panel, and one-command deployment to a cheap Ubuntu VPS.

Built with **Next.js 15 (App Router) · TypeScript · PostgreSQL · Prisma ·
Stripe · Tailwind CSS 4**.

---

## Why this is "deploy-ready"

- **SEO-first / no blank pages** — every storefront page is server-rendered, so
  Googlebot receives full HTML with product data and JSON-LD structured data.
  `sitemap.xml` and `robots.txt` are generated automatically.
- **Real commerce** — cart, Stripe Checkout (card + PayPal + Klarna via Stripe),
  server-side authoritative pricing, orders, inventory, webhook fulfilment.
- **Admin panel** — protected `/admin` with product CRUD, order management, and a
  KPI dashboard.
- **Security** — nonce-based CSP, HSTS + hardened headers, JWT admin sessions
  (httpOnly cookies), bcrypt password hashing, Zod validation everywhere,
  in-memory rate limiting, Stripe webhook signature verification, an audit log,
  and structured (pino) logging.
- **Modular** — clean separation: `src/lib` (domain/services), `src/components`
  (UI), `src/app` (routes/pages/API), `prisma` (schema/seed/import).

---

## Quick start (local)

Prerequisites: **Node 20+** and a **PostgreSQL** database.

```bash
cp .env.example .env          # then edit DATABASE_URL etc.
npm install
npx prisma migrate dev        # create the schema
npm run db:seed               # regions + 36 products + admin user
npm run dev                   # http://localhost:3000
```

Admin: <http://localhost:3000/admin> — sign in with `ADMIN_EMAIL` /
`ADMIN_PASSWORD` from your `.env`.

> No Postgres handy? Any local instance works — just point `DATABASE_URL` at it.
> The project was validated against Postgres 16/17.

---

## Everyday commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build (`prisma generate` + `next build`) |
| `npm run start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:seed` | Idempotent seed (regions, products, admin) |
| `npm run db:import -- ./data/products.csv` | Bulk import the **real** catalog |
| `npx prisma studio` | Visual DB browser |

---

## Loading the real catalog

The seed ships 36 placeholder products (one €20 case per country, region images
as placeholders). Replace them either way:

1. **Admin panel** — `/admin/products` → edit each product, paste a real image URL,
   tweak copy/price.
2. **Bulk import** — drop a JSON or CSV file and run:
   ```bash
   npm run db:import -- ./data/products.csv
   ```
   Columns: `region, slug, name, description, price` (euros) *or* `priceCents`,
   `image, gallery` (`;`-separated), `stock, active, featured`. Existing products
   (matched by `slug`) are **updated**, never deleted. See
   [`data/products.example.csv`](data/products.example.csv).

---

## Stripe

Placeholder keys ship in `.env.example`; checkout is safely disabled until you
add real ones.

1. Get test keys at <https://dashboard.stripe.com/test/apikeys> → set
   `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
2. Local webhooks:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   Copy the `whsec_…` into `STRIPE_WEBHOOK_SECRET`.
3. In production, add a webhook endpoint pointing at
   `https://your-domain/api/webhooks/stripe` for the `checkout.session.completed`
   and `checkout.session.expired` events.

---

## Deploy to a VPS

See **[DEPLOY.md](DEPLOY.md)** — a step-by-step runbook for Contabo / Hetzner
Ubuntu using Docker Compose (app + Postgres + optional Nginx/TLS).

```bash
cp .env.production.example .env.production   # fill in secrets
docker compose up -d --build                 # app on :3000
# add the reverse proxy + TLS:
docker compose --profile proxy up -d --build
```

---

## Project structure

```
src/
  app/                 # routes (App Router)
    (storefront)       # /, /shop, /region/[slug], /product/[slug], /reviews, /contact, legal
    admin/             # /admin (login + protected panel via route group)
    api/               # /api/checkout, /api/webhooks/stripe, /api/search
    sitemap.ts robots.ts
  components/          # UI (header, footer, cart, product cards, search, JSON-LD)
  lib/                 # db, auth/session, stripe, validation, rate-limit, logger, queries, money
prisma/
  schema.prisma        # data model
  seed.ts catalog.ts   # seed + migrated catalog structure
  import.ts            # real-catalog importer
deploy/                # nginx.conf (+ certbot dirs at runtime)
legacy/                # the original static site, kept for reference
```

---

## License

Proprietary — © GlobeCase.
