import { formatMoney } from "./money";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://globe-case.com").replace(/\/$/, "");
const SUPPORT = process.env.STORE_SUPPORT_EMAIL || "support@globe-case.com";

const BRAND = "#1a3c34";
const ACCENT = "#c8964e";

export type EmailOrderItem = {
  name: string;
  phoneModel?: string | null;
  quantity: number;
  priceCents: number;
};

export type EmailOrder = {
  number: string;
  email?: string | null;
  customerName?: string | null;
  currency: string;
  totalCents: number;
  items: EmailOrderItem[];
  shippingAddress?: unknown;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  status?: string;
};

export type RenderedEmail = { subject: string; html: string; text: string };

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function layout(title: string, preheader: string, bodyHtml: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#f2f3f5;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
<span style="display:none!important;opacity:0;color:#f2f3f5;">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f3f5;padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.06);">
<tr><td style="background:${BRAND};padding:22px 28px;">
<span style="font-size:22px;font-weight:700;color:#fff;letter-spacing:.5px;">Globe<span style="color:${ACCENT};">Case</span></span>
</td></tr>
<tr><td style="padding:28px;">${bodyHtml}</td></tr>
<tr><td style="padding:20px 28px;background:#0f2a23;color:rgba(255,255,255,.7);font-size:12px;line-height:1.6;">
GlobeCase · Worldwide free shipping · 7-day returns<br>
Questions? <a href="mailto:${SUPPORT}" style="color:${ACCENT};">${SUPPORT}</a> · <a href="${SITE_URL}" style="color:${ACCENT};">globe-case.com</a>
</td></tr>
</table></td></tr></table></body></html>`;
}

function itemsTable(order: EmailOrder): string {
  const rows = order.items
    .map(
      (i) => `<tr>
<td style="padding:10px 0;border-bottom:1px solid #eee;">${esc(i.name)}${
        i.phoneModel ? `<br><span style="color:#5a6570;font-size:13px;">Device: ${esc(i.phoneModel)}</span>` : ""
      }</td>
<td style="padding:10px 0;border-bottom:1px solid #eee;text-align:center;">×${i.quantity}</td>
<td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;">${formatMoney(
        i.priceCents * i.quantity,
        order.currency,
      )}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
${rows}
<tr><td style="padding:12px 0 0;font-weight:700;">Total</td><td></td>
<td style="padding:12px 0 0;text-align:right;font-weight:700;">${formatMoney(order.totalCents, order.currency)}</td></tr>
</table>`;
}

function addressBlock(order: EmailOrder): string {
  const a = order.shippingAddress as { name?: string; address?: Record<string, string> } | null;
  if (!a) return "";
  const ad = a.address ?? (a as Record<string, string>);
  const line = [ad.line1, ad.line2, ad.postal_code, ad.city, ad.state, ad.country].filter(Boolean).join(", ");
  if (!line && !a.name) return "";
  return `<p style="margin:18px 0 0;color:#5a6570;font-size:13px;">Shipping to:<br><strong style="color:#1a1a1a;">${esc(
    a.name || "",
  )}</strong><br>${esc(line)}</p>`;
}

function btn(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${ACCENT};color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700;font-size:14px;">${esc(
    label,
  )}</a>`;
}

function textFallback(order: EmailOrder, intro: string): string {
  const items = order.items
    .map((i) => `- ${i.name}${i.phoneModel ? ` (${i.phoneModel})` : ""} x${i.quantity} — ${formatMoney(i.priceCents * i.quantity, order.currency)}`)
    .join("\n");
  return `${intro}\n\nOrder ${order.number}\n${items}\nTotal: ${formatMoney(order.totalCents, order.currency)}\n\nglobe-case.com`;
}

/** Sent to the customer once payment succeeds. */
export function orderConfirmationEmail(order: EmailOrder): RenderedEmail {
  const hi = order.customerName ? `Hi ${esc(order.customerName.split(" ")[0])},` : "Hi there,";
  const body = `<h1 style="margin:0 0 6px;font-size:22px;color:${BRAND};">Thank you for your order!</h1>
<p style="margin:0 0 16px;color:#5a6570;">${hi} we've received your order <strong>${esc(order.number)}</strong> and we're preparing it. You'll get another email when it ships.</p>
${itemsTable(order)}
${addressBlock(order)}
<p style="margin:22px 0 0;">${btn(`${SITE_URL}/shop`, "Continue shopping")}</p>`;
  return {
    subject: `Order confirmed — ${order.number}`,
    html: layout("Order confirmed", `Your GlobeCase order ${order.number} is confirmed`, body),
    text: textFallback(order, "Thank you for your order! We've received it and are preparing it."),
  };
}

/** Sent to the shop owner on every new paid order. */
export function newOrderAlertEmail(order: EmailOrder): RenderedEmail {
  const body = `<h1 style="margin:0 0 6px;font-size:22px;color:${BRAND};">🎉 New order — ${esc(order.number)}</h1>
<p style="margin:0 0 16px;color:#5a6570;">${esc(order.email || "a customer")} just placed an order for ${formatMoney(
    order.totalCents,
    order.currency,
  )}.</p>
${itemsTable(order)}
${addressBlock(order)}
<p style="margin:22px 0 0;">${btn(`${SITE_URL}/admin/orders`, "Open in admin")}</p>`;
  return {
    subject: `New order ${order.number} — ${formatMoney(order.totalCents, order.currency)}`,
    html: layout("New order", `New order ${order.number}`, body),
    text: textFallback(order, `New order ${order.number} from ${order.email || "a customer"}.`),
  };
}

/** Sent to the customer when the order ships / status changes. */
export function orderShippedEmail(order: EmailOrder): RenderedEmail {
  const tracking =
    order.trackingNumber || order.trackingUrl
      ? `<p style="margin:16px 0 0;">Tracking: <strong>${esc(order.trackingNumber || "")}</strong>${
          order.trackingUrl ? `<br>${btn(order.trackingUrl, "Track your parcel")}` : ""
        }</p>`
      : "";
  const body = `<h1 style="margin:0 0 6px;font-size:22px;color:${BRAND};">Your order is on its way! 📦</h1>
<p style="margin:0 0 16px;color:#5a6570;">Order <strong>${esc(order.number)}</strong> has shipped.</p>
${itemsTable(order)}
${tracking}
${addressBlock(order)}`;
  return {
    subject: `Your GlobeCase order has shipped — ${order.number}`,
    html: layout("Order shipped", `Order ${order.number} has shipped`, body),
    text: textFallback(order, `Your order ${order.number} has shipped.${order.trackingNumber ? ` Tracking: ${order.trackingNumber}` : ""}`),
  };
}

/** Generic status-change note (cancelled / refunded). */
export function orderStatusEmail(order: EmailOrder, status: string): RenderedEmail {
  const nice = status.charAt(0) + status.slice(1).toLowerCase();
  const body = `<h1 style="margin:0 0 6px;font-size:22px;color:${BRAND};">Order ${esc(order.number)} — ${esc(nice)}</h1>
<p style="margin:0 0 16px;color:#5a6570;">Your order status is now <strong>${esc(nice)}</strong>. If you have any questions, just reply to this email.</p>
${itemsTable(order)}`;
  return {
    subject: `Order ${order.number} — ${nice}`,
    html: layout(`Order ${nice}`, `Order ${order.number} is ${nice}`, body),
    text: textFallback(order, `Your order ${order.number} status is now ${nice}.`),
  };
}

/** Welcome + 5%-off code for a new newsletter subscriber (#22). */
export function subscribeWelcomeEmail(code: string, unsubUrl: string): RenderedEmail {
  const body = `<h1 style="margin:0 0 6px;font-size:22px;color:${BRAND};">Welcome to GlobeCase 🎉</h1>
<p style="margin:0 0 16px;color:#5a6570;">Thanks for subscribing! Here's <strong>5% off your first order</strong>:</p>
<p style="margin:0 0 18px;text-align:center;"><span style="display:inline-block;border:2px dashed ${ACCENT};border-radius:10px;padding:12px 24px;font-size:22px;font-weight:700;letter-spacing:2px;color:${BRAND};">${esc(code)}</span></p>
<p style="margin:0 0 22px;color:#5a6570;">Enter it in the cart at checkout. Worldwide free shipping and 7-day returns on every order.</p>
<p style="text-align:center;">${btn(`${SITE_URL}/shop`, "Shop now")}</p>
<p style="margin:24px 0 0;text-align:center;font-size:11px;color:#9aa4ad;"><a href="${unsubUrl}" style="color:#9aa4ad;">Unsubscribe</a></p>`;
  return {
    subject: "Your 5% GlobeCase code inside 🎁",
    html: layout("Welcome to GlobeCase", "Your 5% off code is inside", body),
    text: `Welcome to GlobeCase! Your 5% off code: ${code}\nShop: ${SITE_URL}/shop\nUnsubscribe: ${unsubUrl}`,
  };
}
