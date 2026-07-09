import "server-only";
import { prisma } from "./db";
import { formatMoney } from "./money";
import type { GeminiTool, GeminiFunctionCall } from "./gemini";

const MIN_PRICE = 100; // €1.00 — floor so the AI can't make things free / crazy-cheap
const MAX_PRICE = 1_000_000; // €10,000

/** System prompt for the admin assistant. */
export const ASSISTANT_SYSTEM = `You are the friendly AI assistant inside the GlobeCase shop admin panel. You help the shop owner manage their products using the available tools.

Rules:
- Prices are always in CENTS (100 cents = €1). If the owner says euros, convert: "25 euro" -> 2500. Prices can't go below €1.
- The "target" of a tool can be: a product's country/name (e.g. "Chechnya"), a slug (e.g. "chechnya"), a REGION name (e.g. "Europe" = all products in Europe), or "all".
- Only call a tool when the owner asks to CHANGE something. For questions, answer briefly using the catalogue below.
- Never invent a product; if it isn't listed, say so (unless the owner is creating a new one).
- If a request is ambiguous, ask ONE short clarifying question instead of guessing.
- When the owner refers to "this image" / "the uploaded one", use the attached image URL with set_image or create_product.
- You can create and delete products; deleting the ENTIRE catalogue is blocked. Every change is backed up first and can be undone.
- Be concise and warm. You never apply changes yourself — the owner reviews and confirms them with an Apply button.`;

const targetParam = {
  type: "string",
  description:
    "What to target: a product country/name (e.g. 'Chechnya'), a slug (e.g. 'chechnya'), a REGION name (e.g. 'Europe' = all Europe products), or 'all'.",
};

export const ASSISTANT_TOOLS: GeminiTool[] = [
  {
    functionDeclarations: [
      {
        name: "set_price",
        description: "Set an absolute price for a product / region / all. price_cents in cents (2500 = €25.00).",
        parameters: {
          type: "object",
          properties: { target: targetParam, price_cents: { type: "integer" } },
          required: ["target", "price_cents"],
        },
      },
      {
        name: "adjust_price",
        description: "Change price by a relative amount for a product / region / all. Give either percent or amount_cents, and direction.",
        parameters: {
          type: "object",
          properties: {
            target: targetParam,
            direction: { type: "string", description: "'increase' or 'decrease'" },
            percent: { type: "integer" },
            amount_cents: { type: "integer" },
          },
          required: ["target", "direction"],
        },
      },
      {
        name: "set_stock",
        description: "Set stock count for a product / region / all. Pass unlimited=true for made-to-order.",
        parameters: {
          type: "object",
          properties: { target: targetParam, stock: { type: "integer" }, unlimited: { type: "boolean" } },
          required: ["target"],
        },
      },
      {
        name: "set_visibility",
        description: "Show or hide products (product / region / all). active=true shows them.",
        parameters: {
          type: "object",
          properties: { target: targetParam, active: { type: "boolean" } },
          required: ["target", "active"],
        },
      },
      {
        name: "set_featured",
        description: "Mark products as featured/bestseller or not (product / region / all).",
        parameters: {
          type: "object",
          properties: { target: targetParam, featured: { type: "boolean" } },
          required: ["target", "featured"],
        },
      },
      {
        name: "create_product",
        description: "Create a NEW product. country is the country/name; region is which region it belongs to.",
        parameters: {
          type: "object",
          properties: {
            country: { type: "string" },
            region: { type: "string" },
            price_cents: { type: "integer" },
            image_url: { type: "string" },
          },
          required: ["country", "region"],
        },
      },
      {
        name: "delete_product",
        description: "Delete a product (or a named set / a region's products). Deleting ALL products is blocked.",
        parameters: {
          type: "object",
          properties: { target: targetParam },
          required: ["target"],
        },
      },
      {
        name: "set_image",
        description: "Set a product's MAIN photo to an uploaded image URL (from the owner's attachments).",
        parameters: {
          type: "object",
          properties: { target: targetParam, image_url: { type: "string" } },
          required: ["target", "image_url"],
        },
      },
      {
        name: "set_image_appearance",
        description:
          "Change how a product's image is displayed (product / region / all). fit: 'contain'/'cover'. scale_percent 50-160. background hex like '#ffffff'.",
        parameters: {
          type: "object",
          properties: {
            target: targetParam,
            fit: { type: "string" },
            scale_percent: { type: "integer" },
            background: { type: "string" },
          },
          required: ["target"],
        },
      },
      {
        name: "set_description",
        description: "Set the description of a product, or of ALL products from a {country} template.",
        parameters: {
          type: "object",
          properties: { target: targetParam, text: { type: "string" } },
          required: ["target", "text"],
        },
      },
      {
        name: "create_promo_code",
        description: "Create a percentage discount code (percent_off 1-90).",
        parameters: {
          type: "object",
          properties: { code: { type: "string" }, percent_off: { type: "integer" } },
          required: ["code", "percent_off"],
        },
      },
    ],
  },
];

// ---------------------------------------------------------------------------

export type PlannedAction = {
  type:
    | "set_prices"
    | "adjust_price"
    | "set_stock"
    | "set_visibility"
    | "set_featured"
    | "create_product"
    | "delete_products"
    | "set_image"
    | "set_appearance"
    | "set_descriptions"
    | "create_promo";
  params: Record<string, unknown>;
  summary: string;
};
export type PlanOutcome = { action?: PlannedAction; note?: string };

function clampInt(v: unknown, min: number, max: number): number | null {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : null;
}
function cleanHex(v: unknown): string | null {
  const s = String(v ?? "").trim().toLowerCase();
  if (/^#?[0-9a-f]{6}$/.test(s) || /^#?[0-9a-f]{3}$/.test(s)) return s.startsWith("#") ? s : `#${s}`;
  const names: Record<string, string> = {
    white: "#ffffff", black: "#111827", grey: "#f7f8f9", gray: "#f7f8f9",
    green: "#1a3c34", "dark green": "#0f2a23", cream: "#e8ded0",
  };
  return names[s] ?? null;
}
function money(cents: number): string {
  return formatMoney(cents, "eur");
}
function idList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
}
function isImageUrl(url: string): boolean {
  return url.startsWith("/uploads/") || /^https?:\/\//.test(url);
}
function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

type Resolved = {
  all: boolean;
  regionName?: string;
  products: { id: string; slug: string; name: string }[];
  error?: string;
};

async function resolveTargets(target: string): Promise<Resolved> {
  const t = (target || "").trim();
  if (!t) return { all: false, products: [], error: "No product was specified." };
  if (["all", "everything", "all products", "every product"].includes(t.toLowerCase())) {
    const products = await prisma.product.findMany({ select: { id: true, slug: true, name: true } });
    return { all: true, products };
  }
  const bySlug = await prisma.product.findFirst({
    where: { slug: t.toLowerCase() },
    select: { id: true, slug: true, name: true },
  });
  if (bySlug) return { all: false, products: [bySlug] };

  const term = t.replace(/\s*phone case\s*/i, "").trim();
  const byName = await prisma.product.findMany({
    where: { name: { contains: term, mode: "insensitive" } },
    select: { id: true, slug: true, name: true },
    take: 6,
  });
  if (byName.length === 1) return { all: false, products: byName };
  if (byName.length > 1)
    return { all: false, products: [], error: `“${t}” matches several products (${byName.map((p) => p.name).join(", ")}). Which one?` };

  // Region name/slug -> all products in that region.
  const region = await prisma.region.findFirst({
    where: { OR: [{ slug: t.toLowerCase() }, { name: { equals: term, mode: "insensitive" } }] },
    select: { id: true, name: true },
  });
  if (region) {
    const products = await prisma.product.findMany({
      where: { regionId: region.id },
      select: { id: true, slug: true, name: true },
    });
    return { all: false, regionName: region.name, products };
  }
  return { all: false, products: [], error: `I couldn't find a product or region matching “${t}”.` };
}

function scopeLabel(r: Resolved): string {
  if (r.all) return `all ${r.products.length} products`;
  if (r.regionName) return `all ${r.products.length} ${r.regionName} products`;
  return r.products[0]?.name ?? "product";
}

async function resolveRegion(name: string): Promise<{ id: string; name: string } | null> {
  const t = name.trim();
  if (!t) return null;
  return prisma.region.findFirst({
    where: { OR: [{ slug: t.toLowerCase() }, { name: { equals: t, mode: "insensitive" } }] },
    select: { id: true, name: true },
  });
}

/** A compact snapshot of the catalogue for the model's context. */
export async function catalogContext(): Promise<string> {
  const products = await prisma.product.findMany({
    orderBy: [{ region: { sortOrder: "asc" } }, { name: "asc" }],
    include: { region: true },
  });
  const regions = [...new Set(products.map((p) => p.region.name))];
  const lines = products.map(
    (p) =>
      `- ${p.name} (slug: ${p.slug}, region: ${p.region.name}, price: ${money(p.priceCents)}, stock: ${p.stock == null ? "unlimited" : p.stock}, ${p.active ? "visible" : "hidden"}${p.featured ? ", featured" : ""})`,
  );
  return `Regions: ${regions.join(", ")}.\nCatalogue (${products.length} products):\n${lines.join("\n")}`;
}

/** Turn one Gemini function call into a validated, resolved, ready-to-apply action. */
export async function planCall(fc: GeminiFunctionCall, attachments: string[]): Promise<PlanOutcome> {
  const a = fc.args || {};
  const target = String(a.target ?? "");

  switch (fc.name) {
    case "set_price": {
      const cents = clampInt(a.price_cents, MIN_PRICE, MAX_PRICE);
      if (cents === null) return { note: "That price doesn't look valid (minimum €1)." };
      const r = await resolveTargets(target);
      if (r.error) return { note: r.error };
      return { action: { type: "set_prices", params: { ids: r.products.map((p) => p.id), price_cents: cents }, summary: `Set the price of ${scopeLabel(r)} to ${money(cents)}.` } };
    }
    case "adjust_price": {
      const r = await resolveTargets(target);
      if (r.error) return { note: r.error };
      const dir = String(a.direction ?? "increase").toLowerCase() === "decrease" ? "decrease" : "increase";
      const percent = a.percent != null ? clampInt(a.percent, 1, 500) : null;
      const amount = a.amount_cents != null ? clampInt(a.amount_cents, 1, MAX_PRICE) : null;
      if (percent === null && amount === null) return { note: "By how much — a percentage or an amount?" };
      const by = percent != null ? `${percent}%` : money(amount!);
      return { action: { type: "adjust_price", params: { ids: r.products.map((p) => p.id), direction: dir, percent, amount_cents: amount }, summary: `${dir === "increase" ? "Increase" : "Decrease"} the price of ${scopeLabel(r)} by ${by} (min €1).` } };
    }
    case "set_stock": {
      const r = await resolveTargets(target);
      if (r.error) return { note: r.error };
      const unlimited = a.unlimited === true || String(a.unlimited).toLowerCase() === "true";
      const stock = unlimited ? null : clampInt(a.stock, 0, 1_000_000);
      if (!unlimited && stock === null) return { note: "How many in stock? (or say unlimited)" };
      return { action: { type: "set_stock", params: { ids: r.products.map((p) => p.id), stock }, summary: `Set stock of ${scopeLabel(r)} to ${unlimited ? "unlimited" : stock}.` } };
    }
    case "set_visibility": {
      const active = a.active === true || String(a.active).toLowerCase() === "true";
      const r = await resolveTargets(target);
      if (r.error) return { note: r.error };
      return { action: { type: "set_visibility", params: { ids: r.products.map((p) => p.id), active }, summary: `${active ? "Show" : "Hide"} ${scopeLabel(r)}.` } };
    }
    case "set_featured": {
      const featured = a.featured === true || String(a.featured).toLowerCase() === "true";
      const r = await resolveTargets(target);
      if (r.error) return { note: r.error };
      return { action: { type: "set_featured", params: { ids: r.products.map((p) => p.id), featured }, summary: `${featured ? "Feature" : "Un-feature"} ${scopeLabel(r)}.` } };
    }
    case "create_product": {
      const country = String(a.country ?? "").trim();
      if (!country) return { note: "What country/name is the new product for?" };
      const region = await resolveRegion(String(a.region ?? ""));
      if (!region) return { note: `Which region should “${country}” go in? (Kavkaz, Europe, Balkan, Asia, Africa, America)` };
      const cents = a.price_cents != null ? clampInt(a.price_cents, MIN_PRICE, MAX_PRICE) : 2000;
      const slug = slugify(country);
      if (!slug) return { note: "That name can't be used as a product." };
      if (await prisma.product.findUnique({ where: { slug } })) return { note: `A product “${country}” (${slug}) already exists.` };
      const url = String(a.image_url ?? "").trim();
      const image = isImageUrl(url) || attachments.includes(url) ? url : null;
      return { action: { type: "create_product", params: { country, name: `${country} Phone Case`, slug, regionId: region.id, regionName: region.name, price_cents: cents, image }, summary: `Create “${country} Phone Case” in ${region.name} at ${money(cents!)}${image ? " with the uploaded photo" : ""}.` } };
    }
    case "delete_product": {
      const r = await resolveTargets(target);
      if (r.error) return { note: r.error };
      const total = await prisma.product.count();
      if (r.all || r.products.length >= total)
        return { note: "I won't delete the whole catalogue — that's blocked. Name the specific product(s) to delete." };
      if (!r.products.length) return { note: "Nothing matched to delete." };
      const names = r.products.map((p) => p.name);
      return { action: { type: "delete_products", params: { ids: r.products.map((p) => p.id), names }, summary: `Delete ${names.length === 1 ? names[0] : `${names.length} products (${names.join(", ")})`}. You can undo this from Backups.` } };
    }
    case "set_image": {
      const url = String(a.image_url ?? "").trim();
      if (!isImageUrl(url) && !attachments.includes(url))
        return { note: "Attach an image first, then tell me which product to use it for." };
      const r = await resolveTargets(target);
      if (r.error) return { note: r.error };
      if (r.all || r.regionName) return { note: "Setting one photo on many products is unusual — name a specific product." };
      return { action: { type: "set_image", params: { ids: r.products.map((p) => p.id), image_url: url }, summary: `Set the main photo of ${r.products[0].name} to the uploaded image.` } };
    }
    case "set_image_appearance": {
      const r = await resolveTargets(target);
      if (r.error) return { note: r.error };
      const data: Record<string, unknown> = {};
      const bits: string[] = [];
      if (a.fit != null) {
        const f = String(a.fit).toLowerCase() === "cover" ? "cover" : "contain";
        data.imageFit = f;
        bits.push(`fit: ${f}`);
      }
      if (a.scale_percent != null) {
        const s = clampInt(a.scale_percent, 50, 160);
        if (s !== null) { data.imageScale = s; bits.push(`zoom: ${s}%`); }
      }
      if (a.background != null) {
        const bg = cleanHex(a.background);
        if (bg) { data.imageBg = bg; bits.push(`background: ${bg}`); }
      }
      if (!Object.keys(data).length) return { note: "Tell me what to change: fit (contain/cover), zoom, or background colour." };
      return { action: { type: "set_appearance", params: { ids: r.products.map((p) => p.id), data }, summary: `Change image display of ${scopeLabel(r)} (${bits.join(", ")}).` } };
    }
    case "set_description": {
      const text = String(a.text ?? "").trim().slice(0, 4000);
      if (text.length < 3) return { note: "That description is too short." };
      const r = await resolveTargets(target);
      if (r.error) return { note: r.error };
      if (r.all)
        return { action: { type: "set_descriptions", params: { template: text }, summary: `Set the description of all ${r.products.length} products from a template.` } };
      return { action: { type: "set_descriptions", params: { ids: r.products.map((p) => p.id), text }, summary: `Update the description of ${scopeLabel(r)}.` } };
    }
    case "create_promo_code": {
      const code = String(a.code ?? "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
      const pct = clampInt(a.percent_off, 1, 90);
      if (code.length < 2) return { note: "Give the code a short name (letters/numbers)." };
      if (pct === null) return { note: "What percentage off should the code give?" };
      return { action: { type: "create_promo", params: { code, percent: pct }, summary: `Create promo code ${code} for ${pct}% off.` } };
    }
    default:
      return { note: `Sorry, I can't do “${fc.name}”.` };
  }
}

/** Execute a validated action. Whitelisted + bounded. Deletes are per-product only. */
export async function executeAction(action: PlannedAction): Promise<{ ok: boolean; message: string }> {
  switch (action.type) {
    case "set_prices": {
      const cents = clampInt(action.params.price_cents, MIN_PRICE, MAX_PRICE);
      const ids = idList(action.params.ids);
      if (cents === null || !ids.length) return { ok: false, message: "Invalid price update." };
      const r = await prisma.product.updateMany({ where: { id: { in: ids } }, data: { priceCents: cents } });
      return { ok: true, message: `Set price of ${r.count} product(s) to ${money(cents)}.` };
    }
    case "adjust_price": {
      const ids = idList(action.params.ids);
      if (!ids.length) return { ok: false, message: "No products." };
      const dir = action.params.direction === "decrease" ? -1 : 1;
      const percent = action.params.percent != null ? Number(action.params.percent) : null;
      const amount = action.params.amount_cents != null ? Number(action.params.amount_cents) : null;
      const products = await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, priceCents: true } });
      let n = 0;
      for (const p of products) {
        let np = p.priceCents;
        if (percent != null) np = Math.round(p.priceCents * (1 + (dir * percent) / 100));
        else if (amount != null) np = p.priceCents + dir * amount;
        np = Math.max(MIN_PRICE, Math.min(MAX_PRICE, np));
        await prisma.product.update({ where: { id: p.id }, data: { priceCents: np } });
        n++;
      }
      return { ok: true, message: `Adjusted the price of ${n} product(s).` };
    }
    case "set_stock": {
      const ids = idList(action.params.ids);
      const stock = action.params.stock === null ? null : clampInt(action.params.stock, 0, 1_000_000);
      if (!ids.length) return { ok: false, message: "No products." };
      const r = await prisma.product.updateMany({ where: { id: { in: ids } }, data: { stock } });
      return { ok: true, message: `Set stock on ${r.count} product(s) to ${stock === null ? "unlimited" : stock}.` };
    }
    case "set_visibility": {
      const ids = idList(action.params.ids);
      const active = action.params.active === true;
      if (!ids.length) return { ok: false, message: "No products." };
      const r = await prisma.product.updateMany({ where: { id: { in: ids } }, data: { active } });
      return { ok: true, message: `${active ? "Showed" : "Hid"} ${r.count} product(s).` };
    }
    case "set_featured": {
      const ids = idList(action.params.ids);
      const featured = action.params.featured === true;
      if (!ids.length) return { ok: false, message: "No products." };
      const r = await prisma.product.updateMany({ where: { id: { in: ids } }, data: { featured } });
      return { ok: true, message: `Updated ${r.count} product(s).` };
    }
    case "create_product": {
      const slug = String(action.params.slug ?? "");
      const regionId = String(action.params.regionId ?? "");
      if (!slug || !regionId) return { ok: false, message: "Invalid product." };
      if (await prisma.product.findUnique({ where: { slug } })) return { ok: false, message: `“${slug}” already exists.` };
      const region = await prisma.region.findUnique({ where: { id: regionId }, select: { id: true } });
      if (!region) return { ok: false, message: "That region no longer exists." };
      const cents = clampInt(action.params.price_cents, MIN_PRICE, MAX_PRICE) ?? 2000;
      const image = typeof action.params.image === "string" && isImageUrl(action.params.image) ? action.params.image : null;
      const country = String(action.params.country ?? "");
      await prisma.product.create({
        data: {
          slug,
          name: String(action.params.name ?? `${country} Phone Case`),
          description: `Wear your roots. The ${country} Phone Case is a premium, culturally inspired design celebrating ${country} — made to order for any iPhone or Samsung. Worldwide free shipping and 7-day returns.`,
          priceCents: cents,
          currency: "eur",
          image,
          regionId,
          active: true,
        },
      });
      return { ok: true, message: `Created ${country} Phone Case.` };
    }
    case "delete_products": {
      const ids = idList(action.params.ids);
      if (!ids.length) return { ok: false, message: "No products." };
      const total = await prisma.product.count();
      if (ids.length >= total) return { ok: false, message: "Refused: that would delete the whole catalogue." };
      const r = await prisma.product.deleteMany({ where: { id: { in: ids } } });
      return { ok: true, message: `Deleted ${r.count} product(s).` };
    }
    case "set_image": {
      const ids = idList(action.params.ids);
      const url = String(action.params.image_url ?? "");
      if (!ids.length || !isImageUrl(url)) return { ok: false, message: "Invalid image." };
      const r = await prisma.product.updateMany({ where: { id: { in: ids } }, data: { image: url } });
      return { ok: true, message: `Updated the photo of ${r.count} product(s).` };
    }
    case "set_appearance": {
      const ids = idList(action.params.ids);
      const raw = (action.params.data ?? {}) as Record<string, unknown>;
      const data: Record<string, unknown> = {};
      if (raw.imageFit === "contain" || raw.imageFit === "cover") data.imageFit = raw.imageFit;
      if (raw.imageScale != null) {
        const s = clampInt(raw.imageScale, 50, 160);
        if (s !== null) data.imageScale = s;
      }
      if (raw.imageBg != null) {
        const bg = cleanHex(raw.imageBg);
        if (bg) data.imageBg = bg;
      }
      if (!ids.length || !Object.keys(data).length) return { ok: false, message: "Nothing to change." };
      const r = await prisma.product.updateMany({ where: { id: { in: ids } }, data });
      return { ok: true, message: `Updated image display of ${r.count} product(s).` };
    }
    case "set_descriptions": {
      if (typeof action.params.template === "string") {
        const template = action.params.template.slice(0, 4000);
        const products = await prisma.product.findMany();
        let n = 0;
        for (const p of products) {
          const country = p.name.replace(/\s*Phone Case\s*$/i, "");
          await prisma.product.update({
            where: { id: p.id },
            data: { description: template.replaceAll("{country}", country).replaceAll("{name}", p.name).slice(0, 4000) },
          });
          n++;
        }
        return { ok: true, message: `Updated the description of ${n} product(s).` };
      }
      const ids = idList(action.params.ids);
      const text = String(action.params.text ?? "").slice(0, 4000);
      if (!ids.length || text.length < 3) return { ok: false, message: "Invalid description." };
      const r = await prisma.product.updateMany({ where: { id: { in: ids } }, data: { description: text } });
      return { ok: true, message: `Updated the description of ${r.count} product(s).` };
    }
    case "create_promo": {
      const code = String(action.params.code ?? "").toUpperCase().replace(/[^A-Z0-9_-]/g, "");
      const pct = clampInt(action.params.percent, 1, 90);
      if (code.length < 2 || pct === null) return { ok: false, message: "Invalid promo code." };
      if (await prisma.promoCode.findUnique({ where: { code } })) return { ok: false, message: `Code ${code} already exists.` };
      await prisma.promoCode.create({ data: { code, kind: "PERCENT", value: pct, active: true } });
      return { ok: true, message: `Created promo code ${code} (${pct}% off).` };
    }
    default:
      return { ok: false, message: "Unknown action." };
  }
}

export const ALLOWED_ACTION_TYPES = new Set<PlannedAction["type"]>([
  "set_prices",
  "adjust_price",
  "set_stock",
  "set_visibility",
  "set_featured",
  "create_product",
  "delete_products",
  "set_image",
  "set_appearance",
  "set_descriptions",
  "create_promo",
]);

/** Actions that modify products (so a snapshot is worth taking before applying). */
export function affectsProducts(actions: PlannedAction[]): boolean {
  return actions.some((a) => a.type !== "create_promo");
}
