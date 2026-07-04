# GlobeCase — Go‑Live Guide

Everything needed to take the store from this folder to a live site accepting
real payments. Written to be followed top‑to‑bottom, copy‑paste friendly, no
prior DevOps experience assumed.

**What you'll end up with:** `https://globe-case.com` served by Nginx over HTTPS,
the Next.js app + PostgreSQL running in Docker, Stripe processing real payments,
and an admin panel at `https://globe-case.com/admin`.

---

## 0. What you need before starting (15‑minute checklist)

| Item | Where | Notes |
|---|---|---|
| A VPS | Contabo / Hetzner | Ubuntu 24.04, 2 vCPU / 4 GB RAM is plenty (~€5–7/mo) |
| A domain | Namecheap / Cloudflare / etc. | e.g. `globe-case.com` |
| Stripe account | https://stripe.com | Free; needs a bank account for payouts |
| SSH access to the VPS | terminal | You get an IP + root password/key when you buy the VPS |
| This project folder | your PC | `C:\Users\saidm\WebsiteForAlan` |

Time to complete: ~60–90 minutes the first time.

---

## PART A — Server + domain

### A1. Create the VPS
Buy an **Ubuntu 24.04** VPS. Note its **public IP** (e.g. `203.0.113.10`).

### A2. Point your domain at it
In your domain registrar's DNS settings, add two **A records**:

```
Type  Name   Value           TTL
A     @      203.0.113.10     Auto
A     www    203.0.113.10     Auto
```

DNS can take 5–60 minutes to propagate. You can continue while it does.

---

## PART B — Put the code on the server

SSH into the server first (from Windows PowerShell or any terminal):

```bash
ssh root@203.0.113.10
```

Then install Docker and create the app folder:

```bash
curl -fsSL https://get.docker.com | sh
mkdir -p /opt/globecase && cd /opt/globecase
```

Now get the project files onto the server. **Pick ONE:**

### Option 1 — Git (recommended, makes updates one command later)
On your **PC**, in `C:\Users\saidm\WebsiteForAlan`, create a repo and push to
GitHub (private repo), then clone on the server:

```powershell
# on your PC (PowerShell), inside the project folder
git init
git add .
git commit -m "GlobeCase store"
# create an EMPTY private repo on github.com first, then:
git remote add origin https://github.com/<you>/globecase.git
git push -u origin main
```
```bash
# on the server
cd /opt/globecase
git clone https://github.com/<you>/globecase.git .
```

> `.env`, `node_modules`, and `.next` are git‑ignored, so no secrets or bloat
> are pushed. You'll create the server's env file in Part C.

### Option 2 — Copy files directly (no GitHub)
From your **PC** (PowerShell), upload the folder (excluding heavy/local dirs):

```powershell
# install once if needed: winget install RsyncProject.rsync  (or use scp)
scp -r (Get-ChildItem C:\Users\saidm\WebsiteForAlan -Exclude node_modules,.next,.env,legacy).FullName root@203.0.113.10:/opt/globecase/
```

---

## PART C — Configure secrets (`.env.production`)

On the **server**, in `/opt/globecase`:

```bash
cp .env.production.example .env.production
nano .env.production   # edit, then Ctrl+O Enter to save, Ctrl+X to exit
```

Generate strong secrets (run each on the server, paste the output in):

```bash
openssl rand -base64 48      # use for AUTH_SECRET
openssl rand -base64 24      # use for POSTGRES_PASSWORD
openssl rand -base64 24      # use for ADMIN_PASSWORD
```

Fill in **every** value:

| Variable | Set it to | Example |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | your real https domain, **no trailing slash** | `https://globe-case.com` |
| `NODE_ENV` | leave as | `production` |
| `POSTGRES_USER` | leave as | `globecase` |
| `POSTGRES_PASSWORD` | a generated secret | `k7Q…` |
| `POSTGRES_DB` | leave as | `globecase` |
| `DATABASE_URL` | **must contain the same password**, host stays `db` | `postgresql://globecase:k7Q…@db:5432/globecase?schema=public` |
| `AUTH_SECRET` | a generated secret | `9v3…` |
| `ADMIN_EMAIL` | your admin login email | `owner@globe-case.com` |
| `ADMIN_PASSWORD` | a generated secret (this is how you log into /admin) | `Zx8…` |
| `STRIPE_SECRET_KEY` | from Stripe (Part F) | `sk_live_…` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | from Stripe (Part F) | `pk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | from Stripe (Part F) | `whsec_…` |
| `STORE_CURRENCY` | leave as | `eur` |
| `STORE_DEFAULT_PRICE_CENTS` | leave as (€20) | `2000` |
| `STORE_SUPPORT_EMAIL` | your public support inbox | `support@globe-case.com` |
| `SEED_ON_DEPLOY` | `true` first deploy (loads the 23 products); set `false` after go‑live so it never re‑touches products | `true` |
| `GEMINI_API_KEY` | leave blank | |

> ⚠️ You can start with Stripe **test** keys (`sk_test_…`, `pk_test_…`) to
> rehearse, then swap to **live** keys later. Everything else stays the same.

---

## PART D — First deploy

From `/opt/globecase` on the server:

```bash
docker compose up -d --build
```

This builds the app, starts PostgreSQL, runs database migrations, seeds the 23
products + admin user, and starts the site on port 3000.

Verify:

```bash
docker compose ps                       # all services "Up"/"healthy"
curl -I http://localhost:3000/robots.txt   # expect HTTP/1.1 200
docker compose logs -f app              # watch logs (Ctrl+C to stop watching)
```

If `curl` returns 200, the store is running. It's not public yet — that's Part E.

---

## PART E — Domain + HTTPS

### E1. Check the Nginx config
```bash
nano deploy/nginx.conf
```
It's already set for `globe-case.com` (server_name + cert paths). Only edit if you're
deploying a different domain — replace every `globe-case.com` with it. Save.

### E2. Start the proxy
```bash
docker compose --profile proxy up -d --build
```
Your site is now reachable at `http://globe-case.com` (plain HTTP). Confirm it
loads in a browser before adding HTTPS.

### E3. Get a free SSL certificate (Let's Encrypt)
```bash
docker run --rm \
  -v $(pwd)/deploy/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/deploy/certbot/www:/var/www/certbot \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  -d globe-case.com -d www.globe-case.com \
  --email you@example.com --agree-tos --no-eff-email
```

### E4. Turn on HTTPS
```bash
nano deploy/nginx.conf
```
- Uncomment the whole `server { listen 443 ssl … }` block at the bottom.
- Uncomment the redirect line in the port‑80 block:
  `location / { return 301 https://$host$request_uri; }`
- Save, then reload:
```bash
docker compose restart nginx
```
Visit `https://globe-case.com` — you should see the padlock. 🔒

### E5. Auto‑renew certificates (set and forget)
```bash
crontab -e
```
Add this line (renews weekly):
```
0 3 * * 0 cd /opt/globecase && docker run --rm -v $(pwd)/deploy/certbot/conf:/etc/letsencrypt -v $(pwd)/deploy/certbot/www:/var/www/certbot certbot/certbot renew --webroot -w /var/www/certbot && docker compose restart nginx
```

---

## PART F — Stripe (the important part)

The store uses **Stripe Checkout** (the hosted, PCI‑compliant payment page). Your
site never touches card numbers — customers pay on Stripe's page and come back.

### F1. Create the account
1. Sign up at https://stripe.com, choose **Belgium** (or your country) as the business location.
2. Complete "Activate your account" (business details + a **bank account** for payouts). You can grab keys and test *before* full activation.

### F2. Understand the two modes
Stripe has **Test mode** (fake cards, no real money) and **Live mode** (real
money). There's a toggle in the top‑right of the dashboard. Keys and webhooks are
**separate** per mode. Rehearse in Test, then repeat in Live.

### F3. Get your API keys
1. Dashboard → **Developers → API keys**.
2. Copy the **Publishable key** (`pk_test_…` / `pk_live_…`) → `.env.production` `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
3. Reveal + copy the **Secret key** (`sk_test_…` / `sk_live_…`) → `STRIPE_SECRET_KEY`.

### F4. Create the webhook (this is what marks orders "Paid")
1. Dashboard → **Developers → Webhooks → Add endpoint**.
2. **Endpoint URL:** `https://globe-case.com/api/webhooks/stripe`
3. **Events to send** — click "Select events" and add:
   - `checkout.session.completed`
   - `checkout.session.expired`
4. Create it, then on the endpoint page click **"Reveal" signing secret** (`whsec_…`) → `.env.production` `STRIPE_WEBHOOK_SECRET`.

### F5. Apply the keys and restart
```bash
nano .env.production        # paste the 3 Stripe values
docker compose up -d app    # restart the app with new env
```

### F6. Choose which payment methods appear (PayPal, Klarna, cards…)
1. Dashboard → **Settings → Payment methods**.
2. Enable the ones you want: **Cards**, **PayPal**, **Klarna**, **Bancontact**, **iDEAL**, Apple/Google Pay, etc.
3. They appear automatically on the Checkout page — **no code change needed**.

### F7. Turn on automatic email receipts (recommended)
Dashboard → **Settings → Customer emails** → enable **"Successful payments"**.
Stripe will email every customer a receipt. (Your own branded order email is a
future add‑on — see the hook in `src/app/api/webhooks/stripe/route.ts`.)

### F8. Rehearse a full test purchase (do this in Test mode first)
1. Make sure `.env.production` has the **test** keys + **test** webhook secret, app restarted.
2. Go to `https://globe-case.com`, add a case to cart, click **Checkout securely**.
3. On Stripe's page use test card **`4242 4242 4242 4242`**, any future expiry, any CVC, any postcode.
4. Complete → you land on the **Thank‑you** page with your order number.
5. Check `https://globe-case.com/admin → Orders`: the order should show **PAID**.
   - If it's stuck on PENDING, the webhook isn't reaching you — see Troubleshooting.

### F9. Go live
1. Flip the dashboard to **Live mode**.
2. Repeat **F3** (live keys) and **F4** (live webhook → same URL) — live has its own keys + signing secret.
3. Put the **live** `sk_live_…`, `pk_live_…`, and live `whsec_…` into `.env.production`.
4. `docker compose up -d app`.
5. Do one small **real** purchase yourself to confirm money lands in Stripe, then refund it from the dashboard.

---

## PART G — Running the store (admin)

- **Log in:** `https://globe-case.com/admin` with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
- **Dashboard:** revenue, paid orders, low‑stock, product counts.
- **Products:** add/edit/delete, change price, image URL, description, mark
  active/featured, set stock (blank = unlimited / made‑to‑order).
- **Orders:** view each order, customer + shipping address, update status
  (PAID → FULFILLED when you ship, etc.).

To **change a product image**, upload the image somewhere public (or keep using
the ones already bundled) and paste its URL, or drop a file into
`public/products/` and reference `/products/yourfile.png`.

---

## PART H — Day‑2 operations

| Task | Command (run in `/opt/globecase`) |
|---|---|
| **Update after code changes** (Git option) | `git pull && docker compose up -d --build` |
| View app logs | `docker compose logs -f app` |
| Restart just the app | `docker compose up -d app` |
| **Back up the database** | `docker compose exec db pg_dump -U globecase globecase > backup_$(date +%F).sql` |
| Restore a backup | `cat backup.sql \| docker compose exec -T db psql -U globecase globecase` |
| Database shell | `docker compose exec db psql -U globecase globecase` |
| Stop everything (data kept) | `docker compose down` |
| Re‑run migrations only | `docker compose run --rm migrate` |

**Set `SEED_ON_DEPLOY=false`** in `.env.production` after your first successful
deploy so future deploys never re‑touch the product catalog.

**Firewall (do this once):**
```bash
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw enable
```

**Automated daily DB backup (cron):**
```bash
crontab -e
# add:
0 2 * * * cd /opt/globecase && docker compose exec -T db pg_dump -U globecase globecase > /opt/globecase/backup_$(date +\%F).sql
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `docker compose ps` shows app restarting | `docker compose logs app` — usually a bad value in `.env.production` (e.g. `DATABASE_URL` password doesn't match `POSTGRES_PASSWORD`). |
| Checkout says "Payments aren't switched on yet" | `STRIPE_SECRET_KEY` is still the placeholder. Put a real key in and `docker compose up -d app`. |
| Order stuck on **PENDING** after paying | Webhook not arriving. Check Dashboard → Webhooks → your endpoint → recent deliveries. Confirm URL is `https://…/api/webhooks/stripe`, the events are subscribed, and `STRIPE_WEBHOOK_SECRET` matches the **current mode** (test vs live). |
| "Invalid signature" in logs | `STRIPE_WEBHOOK_SECRET` is from the wrong mode or a different endpoint. Copy the exact signing secret from that endpoint. |
| HTTPS not working | Re‑check DNS points to the server, certbot succeeded (`ls deploy/certbot/conf/live/`), and the 443 block is uncommented. `docker compose restart nginx`. |
| Images not loading | They're bundled in `public/`. If you added new ones, redeploy so they're copied into the image. |
| Site loads but styles look broken | Hard‑refresh (Ctrl+Shift+R). If it persists, `docker compose up -d --build app`. |

---

## Pre‑launch checklist

- [ ] DNS A records point to the server; `https://globe-case.com` loads with a padlock
- [ ] `.env.production` has **live** Stripe keys + **live** webhook secret
- [ ] Strong `AUTH_SECRET`, `ADMIN_PASSWORD`, `POSTGRES_PASSWORD` (not the examples)
- [ ] One real test purchase completed and refunded; order showed **PAID** in /admin
- [ ] Stripe payment methods enabled (cards + PayPal/Klarna as desired)
- [ ] Stripe automatic receipts turned on
- [ ] `SEED_ON_DEPLOY=false` set after first deploy
- [ ] Firewall enabled; daily DB backup cron added
- [ ] Legal pages (return/privacy/terms) reviewed for your business
- [ ] You can log into `/admin` and edit a product
