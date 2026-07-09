import "server-only";
import { prisma } from "./db";
import { formatMoney } from "./money";
import type { GeminiTool, GeminiFunctionCall } from "./gemini";

const MIN_PRICE = 100; // €1.00 floor — can't make things free / crazy-cheap
const MAX_PRICE = 1_000_000; // €10,000

/**
 * System prompt. The model is the brain: it receives the full catalogue and is
 * responsible for turning ANY phrasing into the exact product slugs (or all:true).
 * The server never fuzzy-matches — it only validates the slugs and executes.
 */
export const ASSISTANT_SYSTEM = `You are the AI operations assistant inside the GlobeCase shop admin. You help the owner manage the store using tools.

How targeting works — this is important:
- The catalogue below lists EVERY product with its slug, region, price, stock and status.
- YOU decide which products a request refers to and pass their exact "slugs". Work it out from anything: a name, nickname, misspelling, a whole region ("the Balkan ones"), a condition ("the cheapest", "anything hidden", "under €20", "everything except Japan"), or "all of them".
- Pass "all": true to affect the whole catalogue. Never ask the owner for a slug — derive it yourself from the catalogue.

Other rules:
- Prices are in CENTS (100 = €1). Convert euros. Prices can't go below €1.
- For colours, output a hex value yourself (e.g. "navy" -> "#000080", "burgundy" -> "#800020").
- Only call a tool when the owner wants to CHANGE something. For questions, answer briefly from the catalogue.
- You can create and delete products; deleting the ENTIRE catalogue is blocked. Every change is backed up first and is undoable.
- If something genuinely isn't supported yet (e.g. orders, analytics), say so in one short sentence. Be concise and warm. You never apply changes yourself — the owner reviews and presses Apply.`;

const slugsParam = {
  type: "array",
  items: { type: "string" },
  description: "Exact product slugs from the catalogue to affect. Omit and set all:true to affect every product.",
};
const allParam = { type: "boolean", description: "Set true to affect ALL products (ignore slugs)." };

export const ASSISTANT_TOOLS: GeminiTool[] = [
  {
    functionDeclarations: [
      {
        name: "set_price",
        description: "Set an absolute price. price_cents in cents (2500 = €25.00).",
        parameters: { type: "object", properties: { slugs: slugsParam, all: allParam, price_cents: { type: "integer" } }, required: ["price_cents"] },
      },
      {
        name: "adjust_price",
        description: "Change price relatively. Give percent OR amount_cents, plus direction ('increase'/'decrease').",
        parameters: { type: "object", properties: { slugs: slugsParam, all: allParam, direction: { type: "string" }, percent: { type: "integer" }, amount_cents: { type: "integer" } }, required: ["direction"] },
      },
      {
        name: "set_stock",
        description: "Set stock count. Pass unlimited:true for made-to-order.",
        parameters: { type: "object", properties: { slugs: slugsParam, all: allParam, stock: { type: "integer" }, unlimited: { type: "boolean" } }, required: [] },
      },
      {
        name: "set_visibility",
        description: "Show (active:true) or hide products from the store.",
        parameters: { type: "object", properties: { slugs: slugsParam, all: allParam, active: { type: "boolean" } }, required: ["active"] },
      },
      {
        name: "set_featured",
        description: "Mark products as featured/bestseller or not.",
        parameters: { type: "object", properties: { slugs: slugsParam, all: allParam, featured: { type: "boolean" } }, required: ["featured"] },
      },
      {
        name: "create_product",
        description: "Create a NEW product. country = its country/name; region_slug = the region's slug from the catalogue.",
        parameters: { type: "object", properties: { country: { type: "string" }, region_slug: { type: "string" }, price_cents: { type: "integer" }, image_url: { type: "string" } }, required: ["country", "region_slug"] },
      },
      {
        name: "delete_product",
        description: "Delete products by their exact slugs. Deleting the whole catalogue is blocked.",
        parameters: { type: "object", properties: { slugs: slugsParam }, required: ["slugs"] },
      },
      {
        name: "set_image",
        description: "Set ONE product's main photo to an uploaded image URL (from the owner's attachments).",
        parameters: { type: "object", properties: { slug: { type: "string" }, image_url: { type: "string" } }, required: ["slug", "image_url"] },
      },
      {
        name: "set_image_appearance",
        description: "Change how images display. fit:'contain'/'cover'. scale_percent 50-160. background is a hex colour.",
        parameters: { type: "object", properties: { slugs: slugsParam, all: allParam, fit: { type: "string" }, scale_percent: { type: "integer" }, background: { type: "string" } }, required: [] },
      },
      {
        name: "set_description",
        description: "Set product descriptions. Text may contain {country}, replaced with each product's country.",
        parameters: { type: "object", properties: { slugs: slugsParam, all: allParam, text: { type: "string" } }, required: ["text"] },
      },
      {
        name: "create_promo_code",
        description: "Create a percentage discount code (percent_off 1-90).",
        parameters: { type: "object", properties: { code: { type: "string" }, percent_off: { type: "integer" } }, required: ["code", "percent_off"] },
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
/** Validate a hex colour (safety only — the model supplies the value). */
function validHex(v: unknown): string | null {
  const s = String(v ?? "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(s)) return s.toLowerCase();
  return null;
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
function toSlug(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

type Scope = { ids: string[]; names: string[]; label: string; missing: string[]; error?: string };

/** Resolve the model-chosen slugs (or all) to concrete products — EXACT match only. */
async function resolveScope(a: Record<string, unknown>): Promise<Scope> {
  if (a.all === true) {
    const ps = await prisma.product.findMany({ select: { id: true, slug: true, name: true } });
    return { ids: ps.map((p) => p.id), names: ps.map((p) => p.name), label: `all ${ps.length} products`, missing: [] };
  }
  const slugs = Array.isArray(a.slugs)
    ? [...new Set(a.slugs.map((s) => String(s).toLowerCase().trim()).filter(Boolean))]
    : [];
  if (!slugs.length) return { ids: [], names: [], label: "", missing: [], error: "I couldn't tell which product(s) you meant — can you say which?" };
  const ps = await prisma.product.findMany({ where: { slug: { in: slugs } }, select: { id: true, slug: true, name: true } });
  const found = new Set(ps.map((p) => p.slug));
  const missing = slugs.filter((s) => !found.has(s));
  const label = ps.length === 1 ? ps[0].name : `${ps.length} products`;
  return { ids: ps.map((p) => p.id), names: ps.map((p) => p.name), label, missing };
}

function missingNote(s: Scope): string {
  return s.missing.length ? ` (couldn't find: ${s.missing.join(", ")})` : "";
}

/** A compact snapshot of the catalogue + regions for the model's context. */
export async function catalogContext(): Promise<string> {
  const [regions, products] = await Promise.all([
    prisma.region.findMany({ orderBy: { sortOrder: "asc" }, select: { name: true, slug: true } }),
    prisma.product.findMany({ orderBy: [{ region: { sortOrder: "asc" } }, { name: "asc" }], include: { region: true } }),
  ]);
  const regLine = regions.map((r) => `${r.name}=${r.slug}`).join(", ");
  const lines = products.map(
    (p) =>
      `- ${p.name} — slug: ${p.slug}, region: ${p.region.name}, price: ${money(p.priceCents)}, stock: ${p.stock == null ? "unlimited" : p.stock}, ${p.active ? "visible" : "hidden"}${p.featured ? ", featured" : ""}`,
  );
  return `Regions (name=slug): ${regLine}.\nCatalogue (${products.length} products):\n${lines.join("\n")}`;
}

/** Turn one Gemini function call into a validated, resolved, ready-to-apply action. */
export async function planCall(fc: GeminiFunctionCall, attachments: string[]): Promise<PlanOutcome> {
  const a = fc.args || {};

  switch (fc.name) {
    case "set_price": {
      const cents = clampInt(a.price_cents, MIN_PRICE, MAX_PRICE);
      if (cents === null) return { note: "That price doesn't look valid (minimum €1)." };
      const s = await resolveScope(a);
      if (s.error) return { note: s.error };
      if (!s.ids.length) return { note: `No matching products${missingNote(s)}.` };
      return { action: { type: "set_prices", params: { ids: s.ids, price_cents: cents }, summary: `Set the price of ${s.label} to ${money(cents)}${missingNote(s)}.` } };
    }
    case "adjust_price": {
      const s = await resolveScope(a);
      if (s.error) return { note: s.error };
      if (!s.ids.length) return { note: `No matching products${missingNote(s)}.` };
      const dir = String(a.direction ?? "increase").toLowerCase() === "decrease" ? "decrease" : "increase";
      const percent = a.percent != null ? clampInt(a.percent, 1, 500) : null;
      const amount = a.amount_cents != null ? clampInt(a.amount_cents, 1, MAX_PRICE) : null;
      if (percent === null && amount === null) return { note: "By how much — a percentage or an amount?" };
      const by = percent != null ? `${percent}%` : money(amount!);
      return { action: { type: "adjust_price", params: { ids: s.ids, direction: dir, percent, amount_cents: amount }, summary: `${dir === "increase" ? "Increase" : "Decrease"} the price of ${s.label} by ${by} (min €1).` } };
    }
    case "set_stock": {
      const s = await resolveScope(a);
      if (s.error) return { note: s.error };
      if (!s.ids.length) return { note: `No matching products${missingNote(s)}.` };
      const unlimited = a.unlimited === true;
      const stock = unlimited ? null : clampInt(a.stock, 0, 1_000_000);
      if (!unlimited && stock === null) return { note: "How many in stock? (or say unlimited)" };
      return { action: { type: "set_stock", params: { ids: s.ids, stock }, summary: `Set stock of ${s.label} to ${unlimited ? "unlimited" : stock}.` } };
    }
    case "set_visibility": {
      const s = await resolveScope(a);
      if (s.error) return { note: s.error };
      if (!s.ids.length) return { note: `No matching products${missingNote(s)}.` };
      const active = a.active === true;
      return { action: { type: "set_visibility", params: { ids: s.ids, active }, summary: `${active ? "Show" : "Hide"} ${s.label}${missingNote(s)}.` } };
    }
    case "set_featured": {
      const s = await resolveScope(a);
      if (s.error) return { note: s.error };
      if (!s.ids.length) return { note: `No matching products${missingNote(s)}.` };
      const featured = a.featured === true;
      return { action: { type: "set_featured", params: { ids: s.ids, featured }, summary: `${featured ? "Feature" : "Un-feature"} ${s.label}${missingNote(s)}.` } };
    }
    case "create_product": {
      const country = String(a.country ?? "").trim();
      if (!country) return { note: "What country/name is the new product for?" };
      const region = await prisma.region.findUnique({ where: { slug: String(a.region_slug ?? "").toLowerCase() }, select: { id: true, name: true } });
      if (!region) return { note: `Which region should “${country}” go in?` };
      const cents = a.price_cents != null ? clampInt(a.price_cents, MIN_PRICE, MAX_PRICE) : 2000;
      const slug = toSlug(country);
      if (!slug) return { note: "That name can't be used as a product." };
      if (await prisma.product.findUnique({ where: { slug } })) return { note: `A product “${country}” (${slug}) already exists.` };
      const url = String(a.image_url ?? "").trim();
      const image = isImageUrl(url) || attachments.includes(url) ? url : null;
      return { action: { type: "create_product", params: { country, name: `${country} Phone Case`, slug, regionId: region.id, price_cents: cents, image }, summary: `Create “${country} Phone Case” in ${region.name} at ${money(cents!)}${image ? " with the uploaded photo" : ""}.` } };
    }
    case "delete_product": {
      const s = await resolveScope({ slugs: a.slugs });
      if (s.error) return { note: s.error };
      if (!s.ids.length) return { note: `No matching products to delete${missingNote(s)}.` };
      const total = await prisma.product.count();
      if (s.ids.length >= total) return { note: "I won't delete the whole catalogue — that's blocked. Name the specific product(s)." };
      return { action: { type: "delete_products", params: { ids: s.ids, names: s.names }, summary: `Delete ${s.names.length === 1 ? s.names[0] : `${s.names.length} products (${s.names.join(", ")})`}. You can undo this from Backups.` } };
    }
    case "set_image": {
      const url = String(a.image_url ?? "").trim();
      if (!isImageUrl(url) && !attachments.includes(url))
        return { note: "Attach an image first, then tell me which product to use it for." };
      const s = await resolveScope({ slugs: [String(a.slug ?? "")] });
      if (!s.ids.length) return { note: `Couldn't find that product${missingNote(s)}.` };
      return { action: { type: "set_image", params: { ids: [s.ids[0]], image_url: url }, summary: `Set the main photo of ${s.names[0]} to the uploaded image.` } };
    }
    case "set_image_appearance": {
      const s = await resolveScope(a);
      if (s.error) return { note: s.error };
      if (!s.ids.length) return { note: `No matching products${missingNote(s)}.` };
      const data: Record<string, unknown> = {};
      const bits: string[] = [];
      if (a.fit != null) {
        const f = String(a.fit).toLowerCase() === "cover" ? "cover" : "contain";
        data.imageFit = f;
        bits.push(`fit: ${f}`);
      }
      if (a.scale_percent != null) {
        const sc = clampInt(a.scale_percent, 50, 160);
        if (sc !== null) { data.imageScale = sc; bits.push(`zoom: ${sc}%`); }
      }
      if (a.background != null) {
        const bg = validHex(a.background);
        if (bg) { data.imageBg = bg; bits.push(`background: ${bg}`); }
      }
      if (!Object.keys(data).length) return { note: "Tell me what to change: fit (contain/cover), zoom, or background colour." };
      return { action: { type: "set_appearance", params: { ids: s.ids, data }, summary: `Change image display of ${s.label} (${bits.join(", ")}).` } };
    }
    case "set_description": {
      const text = String(a.text ?? "").trim().slice(0, 4000);
      if (text.length < 3) return { note: "That description is too short." };
      const s = await resolveScope(a);
      if (s.error) return { note: s.error };
      if (!s.ids.length) return { note: `No matching products${missingNote(s)}.` };
      return { action: { type: "set_descriptions", params: { ids: s.ids, text }, summary: `Update the description of ${s.label}${text.includes("{country}") ? " (per-country template)" : ""}.` } };
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
        const bg = validHex(raw.imageBg);
        if (bg) data.imageBg = bg;
      }
      if (!ids.length || !Object.keys(data).length) return { ok: false, message: "Nothing to change." };
      const r = await prisma.product.updateMany({ where: { id: { in: ids } }, data });
      return { ok: true, message: `Updated image display of ${r.count} product(s).` };
    }
    case "set_descriptions": {
      const ids = idList(action.params.ids);
      const text = String(action.params.text ?? "").slice(0, 4000);
      if (!ids.length || text.length < 3) return { ok: false, message: "Invalid description." };
      if (text.includes("{country}") || text.includes("{name}")) {
        const products = await prisma.product.findMany({ where: { id: { in: ids } } });
        let n = 0;
        for (const p of products) {
          const country = p.name.replace(/\s*Phone Case\s*$/i, "");
          await prisma.product.update({
            where: { id: p.id },
            data: { description: text.replaceAll("{country}", country).replaceAll("{name}", p.name).slice(0, 4000) },
          });
          n++;
        }
        return { ok: true, message: `Updated the description of ${n} product(s).` };
      }
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
