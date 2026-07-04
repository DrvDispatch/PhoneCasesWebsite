# Email setup — globe-case.com (free, fully branded)

Three pieces, all pointing at `@globe-case.com`, **$0/month**:

| Piece | Job | Direction | Where it's configured |
|-------|-----|-----------|-----------------------|
| **Resend** | Automated order confirmations / status updates from the app | Outbound (app) | `.env` SMTP_* (USER=`resend`, PASS=Resend API key) |
| **Cloudflare Email Routing** | Receive mail sent to `support@` / `orders@` and forward to your Gmail | Inbound | Cloudflare dashboard (free) |
| **Gmail "Send mail as"** | Reply from Gmail *as* `support@globe-case.com` via Resend SMTP | Outbound (manual replies) | Gmail settings |

Net effect: customers only ever see `@globe-case.com`. You read and reply inside the
`globecase660@gmail.com` inbox you already use. The gmail address is never shown publicly.

DNS is on **Cloudflare**. Sending is already on **Resend**.

---

## Order matters — do these in sequence

Gmail's send-as step emails a confirmation code to `support@globe-case.com`, so the
**forwarding (Part 1) must work before the Gmail step (Part 2)**, or the code never arrives.

---

## Part 1 — Cloudflare Email Routing (inbound forwarding)

1. Cloudflare dashboard → select **globe-case.com** → left sidebar **Email → Email Routing**.
2. Click **Get started / Enable**. Cloudflare will offer to **automatically add the
   required DNS records** (MX + an SPF TXT). Accept it.
   - ⚠️ **SPF caution:** if Resend already added a root `TXT` record starting with
     `v=spf1`, do **not** end up with two. There must be exactly ONE. If Cloudflare
     creates a second, merge them into one record (see "SPF merge" below).
3. **Destination address:** add `globecase660@gmail.com`. Cloudflare sends it a
   verification email — open it in Gmail and click **Verify**.
4. **Custom addresses** — create routes:
   | Address | Action | Destination |
   |---------|--------|-------------|
   | `support@globe-case.com` | Send to | globecase660@gmail.com |
   | `orders@globe-case.com`  | Send to | globecase660@gmail.com |

   (Skip a catch-all `*@` unless you want every typo/spam address to hit your inbox.
   Two explicit routes is cleaner.)
5. Test: from any outside account, email `support@globe-case.com` → it should land in
   the Gmail inbox within a minute.

### SPF merge (only if two v=spf1 records appear)
Keep one root TXT. Combine the includes, e.g.:
```
v=spf1 include:_spf.mx.cloudflare.net include:amazonses.com ~all
```
(The exact Resend include depends on how Resend verified the domain — if Resend used a
`send.` subdomain, its SPF is on that subdomain and the root is untouched, so no merge
is needed.)

---

## Part 2 — Gmail "Send mail as" (reply branded, via Resend)

Do this in the **globecase660@gmail.com** account.

1. Have a **Resend API key** ready: Resend dashboard → **API Keys** → reuse your
   existing key, or **Create API Key** named `gmail-sendas` (better — you can revoke it
   independently). Copy `re_...`. **You paste this into Gmail yourself — never share it.**
2. Gmail → **⚙ Settings → See all settings → Accounts and Import →
   "Send mail as" → Add another email address**.
3. - **Name:** `GlobeCase Support`
   - **Email address:** `support@globe-case.com`
   - **Untick** "Treat as an alias." → **Next Step**.
4. SMTP server settings:
   - **SMTP Server:** `smtp.resend.com`
   - **Port:** `465`
   - **Username:** `resend`
   - **Password:** your Resend API key (`re_...`)
   - **Secured connection using SSL** (selected for 465). → **Add Account**.
5. Gmail emails a confirmation code to `support@globe-case.com`. Because Part 1 forwards
   it, the code arrives in this same inbox. Enter it (or click the link) to confirm.
6. (Optional) Repeat for `orders@globe-case.com` if you want to reply as that too.
7. (Recommended) Accounts and Import → **"When replying to a message: Reply from the
   same address the message was sent to"** — so replies to customer mail auto-use the
   branded address.

Now: composing/replying in Gmail, pick `support@globe-case.com` in the **From**
dropdown, and it sends through Resend as that address.

---

## Part 3 — App config (handled in the repo)

The store's own automated emails already go via Resend. We only align the reply-to /
support address so customer replies to order emails land in the forwarded inbox:

```
MAIL_FROM="GlobeCase <orders@globe-case.com>"      # unchanged — Resend From
STORE_SUPPORT_EMAIL="support@globe-case.com"        # reply-to for order emails (forwards to gmail)
OWNER_EMAIL="globecase660@gmail.com"                # private new-order alerts (fine as gmail)
SMTP_HOST="smtp.resend.com" / SMTP_USER="resend" / SMTP_PASS=<resend key>
```

Public site lists `support@globe-case.com` (help) and `orders@globe-case.com` (order
questions). No gmail anywhere customer-facing.

---

## Part 4 — Verify end to end

1. Outsider → `support@globe-case.com` → arrives in Gmail. ✅ (Part 1)
2. Reply from Gmail as `support@globe-case.com` → arrives at the outsider, not in spam,
   From shows the branded address. ✅ (Part 2)
3. Place a test order (or `npm run mail:test you@somewhere`) → order email sends from
   `orders@globe-case.com`; replying to it reaches the Gmail inbox. ✅ (Part 3)

## Troubleshooting
| Symptom | Fix |
|---------|-----|
| Gmail send-as code never arrives | Part 1 forwarding not verified yet, or route for `support@` not created. |
| Forwarded mail missing / in spam | Ensure exactly ONE root SPF record (merge if needed). Give DNS a few minutes. |
| Gmail send-as rejects SMTP | Username must be literally `resend`; password is the Resend API key; port 465 + SSL. |
| Replies still show the gmail | In the From dropdown pick the branded address, or enable "reply from same address." |
