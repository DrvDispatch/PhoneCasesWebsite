import "server-only";
import { prisma } from "./db";
import { formatMoney } from "./money";
import type { GeminiTool, GeminiFunctionCall } from "./gemini";

/** System prompt for the admin assistant. */
export const ASSISTANT_SYSTEM = `You are the friendly AI assistant inside the GlobeCase shop admin panel. You help the shop owner manage their products using the available tools.

Rules:
- Prices are always in CENTS (100 cents = €1). If the owner says euros, convert: "25 euro" -> 2500.
- Only call a tool when the owner asks to CHANGE something. For questions, answer briefly using the catalogue below.
- Refer to products by their exact name/slug from the catalogue. Never invent a product; if it isn't listed, say so.
- If a request is ambiguous (e.g. two products match), ask ONE short clarifying question instead of guessing.
- When the owner refers to "this image" / "this photo" / "the uploaded one", use the attached image URL with set_image.
- Be concise and warm. You never apply changes yourself — the owner reviews and confirms them with an Apply button.`;

const targetParam = {
  type: "string",
  description:
    "Which product: its country/name (e.g. 'Chechnya') or slug (e.g. 'chechnya'). Use 'all' to affect every product.",
};

export const ASSISTANT_TOOLS: GeminiTool[] = [
  {
    functionDeclarations: [
      {
        name: "set_price",
        description: "Set the price of a product, or of 'all' products. price_cents is in cents (2500 = €25.00).",
        parameters: {
          type: "object",
          properties: { target: targetParam, price_cents: { type: "integer" } },
          required: ["target", "price_cents"],
        },
      },
      {
        name: "set_visibility",
        description: "Show or hide a product (or 'all'). active=true shows it in the store; false hides it.",
        parameters: {
          type: "object",
          properties: { target: targetParam, active: { type: "boolean" } },
          required: ["target", "active"],
        },
      },
      {
        name: "set_featured",
        description: "Mark a product (or 'all') as featured/bestseller, or remove that.",
        parameters: {
          type: "object",
          properties: { target: targetParam, featured: { type: "boolean" } },
          required: ["target", "featured"],
        },
      },
      {
        name: "set_image",
        description:
          "Set a product's MAIN photo to an uploaded image. image_url must be one of the attached image URLs the owner provided.",
        parameters: {
          type: "object",
          properties: { target: targetParam, image_url: { type: "string" } },
          required: ["target", "image_url"],
        },
      },
      {
        name: "set_image_appearance",
        description:
          "Change how a product's image is displayed (or 'all'). fit: 'contain' shows the whole image, 'cover' fills and crops. scale_percent 50-160. background is a hex colour like '#ffffff'.",
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
        description:
          "Set the description of a product, or of ALL products from a template. For 'all', text may contain {country}, replaced with each product's country.",
        parameters: {
          type: "object",
          properties: { target: targetParam, text: { type: "string" } },
          required: ["target", "text"],
        },
      },
      {
        name: "create_promo_code",
        description: "Create a percentage discount code customers type at checkout. percent_off is 1-90.",
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
  type: "set_prices" | "set_visibility" | "set_featured" | "set_image" | "set_appearance" | "set_descriptions" | "create_promo";
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

async function resolveTargets(
  target: string,
): Promise<{ all: boolean; products: { id: string; slug: string; name: string }[]; error?: string }> {
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
  return { all: false, products: [], error: `I couldn't find a product matching “${t}”.` };
}

/** A compact snapshot of the catalogue for the model's context. */
export async function catalogContext(): Promise<string> {
  const products = await prisma.product.findMany({
    orderBy: [{ region: { sortOrder: "asc" } }, { name: "asc" }],
    include: { region: true },
  });
  const lines = products.map(
    (p) =>
      `- ${p.name} (slug: ${p.slug}, region: ${p.region.name}, price: ${money(p.priceCents)}, ${p.active ? "visible" : "hidden"}${p.featured ? ", featured" : ""})`,
  );
  return `Catalogue (${products.length} products):\n${lines.join("\n")}`;
}

/** Turn one Gemini function call into a validated, resolved, ready-to-apply action. */
export async function planCall(fc: GeminiFunctionCall, attachments: string[]): Promise<PlanOutcome> {
  const a = fc.args || {};
  const target = String(a.target ?? "");

  switch (fc.name) {
    case "set_price": {
      const cents = clampInt(a.price_cents, 1, 1_000_000);
      if (cents === null) return { note: "That price doesn't look valid." };
      const r = await resolveTargets(target);
      if (r.error) return { note: r.error };
      const scope = r.all ? `all ${r.products.length} products` : r.products[0].name;
      return { action: { type: "set_prices", params: { ids: r.products.map((p) => p.id), price_cents: cents }, summary: `Set the price of ${scope} to ${money(cents)}.` } };
    }
    case "set_visibility": {
      const active = a.active === true || String(a.active).toLowerCase() === "true";
      const r = await resolveTargets(target);
      if (r.error) return { note: r.error };
      const scope = r.all ? `all ${r.products.length} products` : r.products[0].name;
      return { action: { type: "set_visibility", params: { ids: r.products.map((p) => p.id), active }, summary: `${active ? "Show" : "Hide"} ${scope}.` } };
    }
    case "set_featured": {
      const featured = a.featured === true || String(a.featured).toLowerCase() === "true";
      const r = await resolveTargets(target);
      if (r.error) return { note: r.error };
      const scope = r.all ? `all ${r.products.length} products` : r.products[0].name;
      return { action: { type: "set_featured", params: { ids: r.products.map((p) => p.id), featured }, summary: `${featured ? "Feature" : "Un-feature"} ${scope}.` } };
    }
    case "set_image": {
      const url = String(a.image_url ?? "").trim();
      if (!isImageUrl(url) && !attachments.includes(url))
        return { note: "Attach an image first, then tell me which product to use it for." };
      const r = await resolveTargets(target);
      if (r.error) return { note: r.error };
      if (r.all) return { note: "Setting one photo on every product is unusual — name a specific product." };
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
      const scope = r.all ? `all ${r.products.length} products` : r.products[0].name;
      return { action: { type: "set_appearance", params: { ids: r.products.map((p) => p.id), data }, summary: `Change image display of ${scope} (${bits.join(", ")}).` } };
    }
    case "set_description": {
      const text = String(a.text ?? "").trim().slice(0, 4000);
      if (text.length < 3) return { note: "That description is too short." };
      const r = await resolveTargets(target);
      if (r.error) return { note: r.error };
      if (r.all)
        return { action: { type: "set_descriptions", params: { template: text }, summary: `Set the description of all ${r.products.length} products from a template.` } };
      return { action: { type: "set_descriptions", params: { ids: r.products.map((p) => p.id), text }, summary: `Update the description of ${r.products[0].name}.` } };
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

/** Execute a validated action against the DB. Whitelisted, bounded, no deletes. */
export async function executeAction(action: PlannedAction): Promise<{ ok: boolean; message: string }> {
  switch (action.type) {
    case "set_prices": {
      const cents = clampInt(action.params.price_cents, 1, 1_000_000);
      const ids = idList(action.params.ids);
      if (cents === null || !ids.length) return { ok: false, message: "Invalid price update." };
      const r = await prisma.product.updateMany({ where: { id: { in: ids } }, data: { priceCents: cents } });
      return { ok: true, message: `Set price of ${r.count} product(s) to ${money(cents)}.` };
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
      if (await prisma.promoCode.findUnique({ where: { code } }))
        return { ok: false, message: `Code ${code} already exists.` };
      await prisma.promoCode.create({ data: { code, kind: "PERCENT", value: pct, active: true } });
      return { ok: true, message: `Created promo code ${code} (${pct}% off).` };
    }
    default:
      return { ok: false, message: "Unknown action." };
  }
}

export const ALLOWED_ACTION_TYPES = new Set<PlannedAction["type"]>([
  "set_prices",
  "set_visibility",
  "set_featured",
  "set_image",
  "set_appearance",
  "set_descriptions",
  "create_promo",
]);
