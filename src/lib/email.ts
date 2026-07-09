import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { env, isEmailConfigured } from "./env";
import { logger } from "./logger";
import {
  orderConfirmationEmail,
  newOrderAlertEmail,
  orderShippedEmail,
  orderStatusEmail,
  subscribeWelcomeEmail,
  type EmailOrder,
} from "./email-templates";

let transporter: Transporter | null = null;

function getTransport(): Transporter | null {
  if (!isEmailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure, // false => STARTTLS on 587
      auth: { user: env.smtpUser, pass: env.smtpPass },
    });
  }
  return transporter;
}

type SendArgs = { to: string; subject: string; html: string; text: string; replyTo?: string };

/** Send an email. Never throws — logs and returns a result so order flow is safe. */
export async function sendMail(args: SendArgs): Promise<{ sent: boolean; reason?: string }> {
  const tx = getTransport();
  if (!tx) {
    logger.warn({ to: args.to, subject: args.subject }, "email skipped — SMTP not configured");
    return { sent: false, reason: "not_configured" };
  }
  if (!args.to) return { sent: false, reason: "no_recipient" };
  try {
    await tx.sendMail({
      from: env.mailFrom,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
      replyTo: args.replyTo || env.supportEmail,
    });
    logger.info({ to: args.to, subject: args.subject }, "email sent");
    return { sent: true };
  } catch (err) {
    logger.error({ err, to: args.to, subject: args.subject }, "email send failed");
    return { sent: false, reason: "send_error" };
  }
}

/** On a paid order: confirm to the customer + alert the owner. */
export async function sendOrderEmails(order: EmailOrder): Promise<void> {
  if (order.email) {
    const c = orderConfirmationEmail(order);
    await sendMail({ to: order.email, subject: c.subject, html: c.html, text: c.text });
  }
  if (env.ownerEmail) {
    const a = newOrderAlertEmail(order);
    await sendMail({
      to: env.ownerEmail,
      subject: a.subject,
      html: a.html,
      text: a.text,
      replyTo: order.email || undefined,
    });
  }
}

/** On status change: notify the customer appropriately. */
export async function sendOrderStatusEmail(order: EmailOrder, status: string): Promise<void> {
  if (!order.email) return;
  const rendered =
    status === "FULFILLED" ? orderShippedEmail(order) : orderStatusEmail(order, status);
  await sendMail({ to: order.email, subject: rendered.subject, html: rendered.html, text: rendered.text });
}

/** Welcome email with the 5%-off code for a new subscriber (#22). Never throws. */
export async function sendSubscribeWelcome(to: string, code: string, unsubUrl: string): Promise<void> {
  const e = subscribeWelcomeEmail(code, unsubUrl);
  await sendMail({ to, subject: e.subject, html: e.html, text: e.text });
}
