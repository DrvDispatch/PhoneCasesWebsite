import { z } from "zod";

/** A single line the browser sends to /api/checkout. */
export const checkoutItemSchema = z.object({
  slug: z.string().min(1).max(80),
  quantity: z.number().int().min(1).max(20),
  phoneModel: z.string().trim().max(80).optional().default(""),
  phoneBrand: z.string().trim().max(40).optional().default(""),
  designChoice: z.string().trim().max(40).optional().default(""),
});

export const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, "Your cart is empty").max(50),
  promoCode: z.string().trim().max(40).optional().default(""),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** Body for the /api/promo cart-preview lookup. */
export const promoLookupSchema = z.object({
  code: z.string().trim().min(1).max(40),
  subtotalCents: z.coerce.number().int().min(0).max(100_000_000),
});

/** Newsletter signup (#22). */
export const subscribeSchema = z.object({
  email: z.string().email().max(200),
});

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
  image: z
    .string()
    .max(2000)
    .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v), "Must be a URL or /path")
    .optional(),
  gallery: z.string().max(6000).optional().default(""),
  designImages: z.string().max(6000).optional().default(""),
  imageFit: z.enum(["contain", "cover"]).default("contain"),
  imageScale: z.coerce.number().int().min(50).max(160).default(100),
  imageBg: z.string().trim().max(24).optional().default("#f7f8f9"),
  stock: z.coerce.number().int().min(0).max(1_000_000).optional().nullable(),
  active: z.coerce.boolean().default(true),
  featured: z.coerce.boolean().default(false),
});

/** Admin create/update promo code (#4). */
export const promoCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, - and _ only"),
  kind: z.enum(["PERCENT", "FIXED"]).default("PERCENT"),
  value: z.coerce.number().int().min(1).max(1_000_000),
  active: z.coerce.boolean().default(true),
  minSubtotalCents: z.coerce.number().int().min(0).max(1_000_000).optional().nullable(),
  maxRedemptions: z.coerce.number().int().min(1).max(1_000_000).optional().nullable(),
  expiresAt: z.string().max(40).optional(),
});

export const pageSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only"),
  title: z.string().min(1).max(160),
  body: z.string().min(1).max(50000),
  published: z.coerce.boolean().default(true),
});

export const reviewSchema = z.object({
  author: z.string().min(1).max(80),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().min(3).max(1000),
  productSlug: z.string().max(80).optional(),
  imageUrl: z
    .string()
    .max(2000)
    .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v), "Must be a URL or /path")
    .optional(),
  approved: z.coerce.boolean().default(true),
});
