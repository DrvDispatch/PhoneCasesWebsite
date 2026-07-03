import { z } from "zod";

/** A single line the browser sends to /api/checkout. */
export const checkoutItemSchema = z.object({
  slug: z.string().min(1).max(80),
  quantity: z.number().int().min(1).max(20),
  phoneModel: z.string().trim().max(80).optional().default(""),
});

export const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, "Your cart is empty").max(50),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const loginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

/** Admin create/update product form. */
export const productSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only"),
  name: z.string().min(1).max(160),
  regionSlug: z.string().min(1).max(80),
  description: z.string().min(1).max(4000),
  priceCents: z.coerce.number().int().min(0).max(1_000_000),
  currency: z.string().min(3).max(4).default("eur"),
  image: z.string().url().max(2000).optional().or(z.literal("")),
  stock: z.coerce.number().int().min(0).max(1_000_000).optional().nullable(),
  active: z.coerce.boolean().default(true),
  featured: z.coerce.boolean().default(false),
});

export const reviewSchema = z.object({
  author: z.string().min(1).max(80),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().min(3).max(1000),
  productSlug: z.string().max(80).optional(),
});
