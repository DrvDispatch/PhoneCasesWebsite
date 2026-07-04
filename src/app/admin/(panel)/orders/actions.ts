"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";
import { sendOrderStatusEmail, sendOrderEmails } from "@/lib/email";
import { OrderStatus, type Order, type OrderItem } from "@prisma/client";

const VALID = new Set(Object.values(OrderStatus));

function toEmailOrder(order: Order & { items: OrderItem[] }) {
  return {
    number: order.number,
    email: order.email,
    customerName: order.customerName,
    currency: order.currency,
    totalCents: order.totalCents,
    items: order.items.map((i) => ({
      name: i.name,
      phoneModel: i.phoneModel,
      quantity: i.quantity,
      priceCents: i.priceCents,
    })),
    shippingAddress: order.shippingAddress,
    trackingNumber: order.trackingNumber,
    trackingUrl: order.trackingUrl,
    status: order.status,
  };
}

export async function updateOrderStatus(id: string, formData: FormData) {
  const admin = await requireAdmin();
  const status = String(formData.get("status") ?? "");
  if (!VALID.has(status as OrderStatus)) return;

  const order = await prisma.order.update({
    where: { id },
    data: {
      status: status as OrderStatus,
      ...(status === "FULFILLED" ? { fulfilledAt: new Date() } : {}),
    },
    include: { items: true },
  });
  await audit({ actor: admin.email, action: "order.status", target: id, meta: { status }, ip: clientIp(await headers()) });

  if (["FULFILLED", "CANCELLED", "REFUNDED"].includes(status)) {
    await sendOrderStatusEmail(toEmailOrder(order), status);
  }
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
}

/** Save tracking + mark shipped, optionally emailing the customer. */
export async function fulfillOrder(id: string, formData: FormData) {
  const admin = await requireAdmin();
  const carrier = String(formData.get("carrier") ?? "").trim() || null;
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim() || null;
  const trackingUrl = String(formData.get("trackingUrl") ?? "").trim() || null;
  const notify = formData.get("notify") != null;

  const order = await prisma.order.update({
    where: { id },
    data: { carrier, trackingNumber, trackingUrl, status: "FULFILLED", fulfilledAt: new Date() },
    include: { items: true },
  });
  await audit({
    actor: admin.email,
    action: "order.fulfill",
    target: id,
    meta: { carrier, trackingNumber },
    ip: clientIp(await headers()),
  });
  if (notify) await sendOrderStatusEmail(toEmailOrder(order), "FULFILLED");

  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
}

/** Re-send the confirmation email (+ owner copy) for an order. */
export async function resendConfirmation(id: string) {
  const admin = await requireAdmin();
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) return;
  await sendOrderEmails(toEmailOrder(order));
  await audit({ actor: admin.email, action: "order.resend_email", target: id, ip: clientIp(await headers()) });
}

/** Save an internal note on an order. */
export async function saveOrderNote(id: string, formData: FormData) {
  await requireAdmin();
  const notes = String(formData.get("notes") ?? "").slice(0, 2000);
  await prisma.order.update({ where: { id }, data: { notes } });
  revalidatePath(`/admin/orders/${id}`);
}
