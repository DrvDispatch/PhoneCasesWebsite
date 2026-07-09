import "server-only";
import { prisma } from "./db";

const KEEP = 25;

/** Snapshot the whole product catalogue (JSON) and prune old snapshots. Returns the id. */
export async function takeSnapshot(label: string): Promise<string> {
  const products = await prisma.product.findMany();
  const snap = await prisma.snapshot.create({
    data: { label: label.slice(0, 240), productCount: products.length, data: products as unknown as object },
  });
  const old = await prisma.snapshot.findMany({
    orderBy: { createdAt: "desc" },
    skip: KEEP,
    select: { id: true },
  });
  if (old.length) await prisma.snapshot.deleteMany({ where: { id: { in: old.map((o) => o.id) } } });
  return snap.id;
}

type ProductRow = { id: string; [k: string]: unknown };

function toProductData(row: ProductRow) {
  return {
    slug: String(row.slug),
    name: String(row.name),
    countryCode: (row.countryCode as string) ?? null,
    description: String(row.description ?? ""),
    priceCents: Number(row.priceCents ?? 2000),
    currency: String(row.currency ?? "eur"),
    image: (row.image as string) ?? null,
    gallery: (row.gallery as string[]) ?? [],
    designImages: (row.designImages as string[]) ?? [],
    imageFit: String(row.imageFit ?? "contain"),
    imageScale: Number(row.imageScale ?? 100),
    imageBg: String(row.imageBg ?? "#f7f8f9"),
    stock: row.stock == null ? null : Number(row.stock),
    active: Boolean(row.active),
    featured: Boolean(row.featured),
    sortOrder: Number(row.sortOrder ?? 0),
    regionId: String(row.regionId),
  };
}

/** Restore the product catalogue to a snapshot: re-create/update its products and
 *  remove any products created after it. Returns counts. */
export async function restoreSnapshot(
  id: string,
): Promise<{ ok: boolean; restored: number; deleted: number; error?: string }> {
  const snap = await prisma.snapshot.findUnique({ where: { id } });
  if (!snap) return { ok: false, restored: 0, deleted: 0, error: "Backup not found." };

  const rows = (snap.data as unknown as ProductRow[]) ?? [];
  const snapIds = new Set(rows.map((r) => r.id));

  const current = await prisma.product.findMany({ select: { id: true } });
  const toDelete = current.filter((c) => !snapIds.has(c.id)).map((c) => c.id);
  let deleted = 0;
  if (toDelete.length) {
    const r = await prisma.product.deleteMany({ where: { id: { in: toDelete } } });
    deleted = r.count;
  }

  let restored = 0;
  for (const row of rows) {
    if (!row?.id) continue;
    const data = toProductData(row);
    // Skip if the region no longer exists (avoid FK failure).
    const region = await prisma.region.findUnique({ where: { id: data.regionId }, select: { id: true } });
    if (!region) continue;
    await prisma.product.upsert({ where: { id: row.id }, update: data, create: { id: row.id, ...data } });
    restored++;
  }
  return { ok: true, restored, deleted };
}

export async function listSnapshots(take = 25) {
  return prisma.snapshot.findMany({
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, label: true, productCount: true, createdAt: true },
  });
}
