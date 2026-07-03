# Deploying GlobeCase to an Ubuntu VPS (Contabo / Hetzner)

A single small VPS (2 vCPU / 4 GB RAM is plenty) runs the whole stack with
Docker Compose: **Next.js app + PostgreSQL + Nginx (TLS)**.

---

## 1. Provision the server

Create an **Ubuntu 22.04/24.04** box (Contabo VPS S or Hetzner CX22 are both
cheap and more than enough). Point your domain's DNS **A record** at its IP:

```
globecase.com      A   <server-ip>
www.globecase.com  A   <server-ip>
```

## 2. Install Docker

```bash
ssh root@<server-ip>
curl -fsSL https://get.docker.com | sh
# optional: run docker as a non-root user
usermod -aG docker $USER
```

## 3. Get the code

```bash
mkdir -p /opt/globecase && cd /opt/globecase
# copy this project here (git clone, scp, or rsync). Example:
#   git clone <your-repo> .
```

## 4. Configure secrets

```bash
cp .env.production.example .env.production
nano .env.production
```

Set at minimum:

- `NEXT_PUBLIC_SITE_URL=https://globecase.com`
- `POSTGRES_PASSWORD` + the matching password inside `DATABASE_URL`
  (host stays `db`)
- `AUTH_SECRET` → `openssl rand -base64 48`
- `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- Stripe keys + `STRIPE_WEBHOOK_SECRET`

## 5. Launch

```bash
# app + db (migrations & seed run automatically before the app starts)
docker compose up -d --build
```

Check it's healthy:

```bash
docker compose ps
curl -I http://localhost:3000/robots.txt
docker compose logs -f app
```

At this point the store is live on port **3000**.

## 6. Add Nginx + HTTPS

Edit `deploy/nginx.conf` and replace `globecase.com` with your domain, then
bring up the proxy:

```bash
docker compose --profile proxy up -d --build
```

Issue certificates with certbot (one-off):

```bash
docker run --rm \
  -v $(pwd)/deploy/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/deploy/certbot/www:/var/www/certbot \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  -d globecase.com -d www.globecase.com \
  --email you@example.com --agree-tos --no-eff-email
```

Then uncomment the HTTPS `server { … }` block (and the HTTP→HTTPS redirect) in
`deploy/nginx.conf` and reload:

```bash
docker compose restart nginx
```

Renewals (cron, e.g. weekly):

```bash
0 3 * * 0 cd /opt/globecase && docker run --rm \
  -v $(pwd)/deploy/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/deploy/certbot/www:/var/www/certbot \
  certbot/certbot renew --webroot -w /var/www/certbot && \
  docker compose restart nginx
```

## 7. Stripe webhook

In the Stripe dashboard add an endpoint:

```
https://globecase.com/api/webhooks/stripe
```

Subscribe to `checkout.session.completed` and `checkout.session.expired`, copy
the signing secret into `.env.production` (`STRIPE_WEBHOOK_SECRET`), then
`docker compose up -d app` to reload.

---

## Operations

| Task | Command |
|---|---|
| Update after code changes | `git pull && docker compose up -d --build` |
| View logs | `docker compose logs -f app` |
| DB shell | `docker compose exec db psql -U globecase` |
| Backup DB | `docker compose exec db pg_dump -U globecase globecase > backup.sql` |
| Restore DB | `cat backup.sql \| docker compose exec -T db psql -U globecase globecase` |
| Re-run migrations only | `docker compose run --rm migrate` |
| Stop everything | `docker compose down` (data persists in the `db-data` volume) |

## Hardening checklist

- [ ] `ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw enable`
- [ ] SSH keys only (`PasswordAuthentication no`)
- [ ] Strong `AUTH_SECRET`, DB and admin passwords (never the examples)
- [ ] Rotate the placeholder secrets before going live
- [ ] Off-server DB backups (cron `pg_dump` → object storage)
- [ ] Point a monitor/uptime check at `/robots.txt`
