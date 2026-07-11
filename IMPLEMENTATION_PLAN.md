# GlobeCase — Implementation Plan (next feature wave)

_Drafted 2026-07-09. Scope agreed: reviews flywheel → assistant orders/analytics → abandoned cart → local payments. Everything deploys to the live site with the tested build → deploy → verify flow; risky pieces ship behind a flag or as moderated/opt-in._

Sequencing rationale: start with the **reviews flywheel** (highest compounding ROI, reuses systems we already have), then the **AI ops copilot** (owner value), then **abandoned cart** (direct revenue), then flip on **local payments** the moment the client's live Stripe lands.

---

## Phase 1 — Reviews flywheel 🔁

### 1.1 Per-product reviews + Google star ratings
**Goal:** star rating + count on product pages and cards; ★ in Google results via structured data.
- **DB:** none required (`Review` already has `author, rating, body, productSlug, imageUrl, approved`). Optional later: `verifiedPurchase Boolean`.
- **Queries (`src/lib/queries.ts`):** `getProductReviews(slug)`; `getReviewStatsBySlug()` → `{ slug: {count, avg} }` for grids.
- **Product page:** rating summary near the title; a "Reviews" section (approved reviews for that product + photos); extend `ProductJsonLd` to emit `aggregateRating` + `review[]` (JSON-LD) so Google shows stars.
- **Cards:** tiny `★ 4.8 (12)` on `ProductCard` when the product has reviews (thread stats through the grids).
- **Public submit:** small "Write a review" form → `POST /api/reviews` (rate-limited, honeypot) creating an **unapproved** review → owner approves in the existing Reviews admin.
- **Effort:** Medium. **Acceptance:** product page shows rating + reviews; Google Rich Results test validates AggregateRating; new reviews land in admin as pending.

### 1.2 Automatic review-request email
**Goal:** a few days after an order ships, auto-ask the customer for a review.
- **DB:** `Order.reviewRequestedAt DateTime?`.
- **Email:** `reviewRequestEmail()` template (branded) with a one-click link to leave a review (per product / a `/review?order=…&token=…` landing).
- **Trigger:** daily cron → secured `GET /api/cron/review-requests` (guarded by `CRON_SECRET`) finds `status=FULFILLED`, `fulfilledAt <= now-3d`, `reviewRequestedAt IS NULL`, sends via Resend, stamps `reviewRequestedAt`.
- **Server:** add `CRON_SECRET` env + a cron entry (`/etc/cron.d/globecase-review-emails`).
- **Effort:** Low–Med. **Acceptance:** a shipped test order 3d old triggers exactly one email; re-runs don't duplicate.

### 1.3 "Track my order" page
**Goal:** self-service order status; fewer "where's my order?" messages.
- **Page `/track`:** form (order number + email). `POST /api/track` looks up by number **and** verifies the email matches (privacy), returns status + items + carrier/tracking + dates as a small timeline. Rate-limited.
- **Nav:** "Track order" link in footer + checkout-success page.
- **Effort:** Low–Med. **Acceptance:** correct email → status shown; wrong email → generic "not found".

---

## Phase 2 — Assistant: orders + analytics 🤖
**Goal:** the assistant becomes a full ops copilot: "revenue this week?", "top sellers", "mark GC-ABC shipped".
- **Context:** inject a compact **stats block** (last 7/30d revenue + order count, top 5 products by qty, # awaiting fulfillment, low-stock) into the assistant system context so it answers most questions with no extra round-trip.
- **New tools:** `lookup_order(number)` (read; returns items/status/customer), `mark_order_shipped(number, carrier, tracking_url)` (write → proposes fulfillment; Apply runs the existing `fulfillOrder` + shipped email). Order actions are audited; a lightweight order snapshot before write.
- **Files:** extend `src/lib/assistant.ts` (tools + planCall + executeAction), the plan/apply routes; add order helpers.
- **Effort:** Medium. **Acceptance:** "revenue this month" answers from real data; "mark GC-X shipped with DHL 123" proposes → Apply marks it fulfilled + emails the customer.

---

## Phase 3 — Abandoned-cart recovery 🛒
**Goal:** recover revenue from shoppers who leave items behind.
- **Email capture:** optional email field in the cart drawer ("get your cart + 5% code") **and** capture from Stripe (session email) — store an `AbandonedCart { email, items Json, createdAt, recoveredAt, remindedAt }`.
- **Trigger:** cron finds carts > ~4h old, not recovered, not reminded → send a "you left something" email (with the 5% code + a link back). Mark `remindedAt`. Mark `recoveredAt` on a matching paid order.
- **Alt quick win:** enable **Stripe's native recovery emails** for expired Checkout sessions (dashboard config, ~0 code) once live — I'll set this up in parallel.
- **DB:** `AbandonedCart` model. **Effort:** Medium (depends on the email-capture UX we choose). **Acceptance:** an abandoned cart with a captured email gets exactly one reminder; converting clears it.

---

## Phase 4 — Local payment methods 💳 _(needs the client's live Stripe)_
**Goal:** big EU conversion lift — Bancontact, iDEAL, Klarna, Apple/Google Pay.
- **Code:** switch the Checkout Session to `automatic_payment_methods: { enabled: true }` (Stripe shows every method enabled in the dashboard + eligible for the currency/country).
- **Config:** enable the methods in the client's Stripe dashboard; ensure domain verification for Apple Pay.
- **Effort:** Low. **Blocked on:** client's live Stripe keys (also unlocks going live for real payments). **Acceptance:** BE shoppers see Bancontact/iDEAL/Klarna at checkout.

---

## Cross-cutting / prerequisites
- **New env:** `CRON_SECRET` (secures the cron endpoints). Set on the server, gitignored via `.env.production`.
- **Schema migration** (one, batched): `Order.reviewRequestedAt`, `AbandonedCart` model, (optional `Review.verifiedPurchase`).
- **Cron entries** on the server: review-request emails (daily), abandoned-cart reminders (hourly). Same pattern as the daily DB backup.
- **Testing:** each phase built locally → `tsc`+`next build` → deploy → verified live (curl + browser), same as everything so far.

## Needs from the client
- **Stripe live keys** → unlocks Phase 4 (local payments) + real payments + Stripe-native abandoned-cart.
- Nothing else blocking; reviews content bootstraps itself via Phase 1.2.

## Suggested order & rough effort
1. **Phase 1 (reviews flywheel)** — biggest ROI, ~most work but self-contained. _(1.3 → 1.1 → 1.2)_
2. **Phase 2 (assistant orders/analytics)** — you get the ops copilot.
3. **Phase 3 (abandoned cart)** — direct revenue.
4. **Phase 4 (local payments)** — flip on the day live Stripe arrives.
