/**
 * Bulk catalog importer for the REAL product data.
 *
 * Usage:
 *   npm run db:import -- ./data/products.json
 *   npm run db:import -- ./data/products.csv
 *
 * JSON shape: an array of objects. CSV: header row with the same keys.
 * Required: region (slug), slug, name. Optional: description, priceCents (or
 * price in euros), image, gallery (";"-separated in CSV), stock, active, featured.
 *
 * Regions are auto-created if missing. Existing products (matched by slug) are
 * updated in place — this NEVER deletes anything.
 */
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { DEFAULT_PRICE_CENTS, productDescription } from "./catalog";

const prisma = new PrismaClient();

/** "north-macedonia" -> "North Macedonia". */
function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

type Row = Record<string, string | number | boolean | string[] | undefined>;

function parseCSV(text: string): Row[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n").filter((l) => l.trim());
  if (!lines.length) return [];
  const headers = splitCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitCSVLine(line);
    const row: Row = {};
    headers.forEach((h, i) => (row[h.trim()] = cells[i]));
    return row;
  });
}

function splitCSVLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function toCents(row: Row): number {
  if (row.priceCents != null && row.priceCents !== "") return Math.round(Number(row.priceCents));
  if (row.price != null && row.price !== "") return Math.round(Number(row.price) * 100);
  return DEFAULT_PRICE_CENTS;
}

function toBool(v: unknown, fallback: boolean): boolean {
  if (v == null || v === "") return fallback;
  return ["1", "true", "yes", "y"].includes(String(v).toLowerCase());
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: npm run db:import -- <path-to.json|.csv>");
    process.exit(1);
  }
  const raw = readFileSync(file, "utf8");
  const rows: Row[] = file.endsWith(".csv") ? parseCSV(raw) : JSON.parse(raw);
  if (!Array.isArray(rows) || !rows.length) {
    console.error("No rows found in import file.");
    process.exit(1);
  }

  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const regionSlug = String(row.region || "").trim().toLowerCase();
    const slug = String(row.slug || "").trim().toLowerCase();
    if (!regionSlug || !slug) {
      console.warn("Skipping row without region+slug:", row);
      continue;
    }

    const region = await prisma.region.upsert({
      where: { slug: regionSlug },
      update: {},
      create: { slug: regionSlug, name: titleCase(regionSlug) },
    });

    const gallery = Array.isArray(row.gallery)
      ? row.gallery
      : String(row.gallery || "")
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean);

    const data = {
      name: String(row.name || `${titleCase(slug)} Phone Case`),
      description: String(row.description || productDescription(titleCase(slug))),
      priceCents: toCents(row),
      currency: String(row.currency || process.env.STORE_CURRENCY || "eur").toLowerCase(),
      image: row.image ? String(row.image) : region.image,
      gallery,
      stock: row.stock != null && row.stock !== "" ? Math.round(Number(row.stock)) : null,
      active: toBool(row.active, true),
      featured: toBool(row.featured, false),
      regionId: region.id,
    };

    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      await prisma.product.update({ where: { slug }, data });
      updated++;
    } else {
      await prisma.product.create({ data: { slug, ...data } });
      created++;
    }
  }

  console.log(`✓ import complete — ${created} created, ${updated} updated`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
