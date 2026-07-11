import "server-only";
import { prisma } from "./db";

/** All regions with their active product counts, ordered for display. */
export function getRegions() {
  return prisma.region.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: { where: { active: true } } } } },
  });
}

export function getRegionBySlug(slug: string) {
  return prisma.region.findUnique({
    where: { slug },
    include: {
      products: {
        where: { active: true },
        orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
      },
    },
  });
}

export function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, active: true },
    include: { region: true },
  });
}

export function getFeaturedProducts(take = 8) {
  return prisma.product.findMany({
    where: { active: true, featured: true },
    include: { region: true },
    orderBy: { sortOrder: "asc" },
    take,
  });
}

/** Every active product, region-ordered — powers the /shop grid. */
export function getAllActiveProducts() {
  return prisma.product.findMany({
    where: { active: true },
    include: { region: true },
    orderBy: [{ region: { sortOrder: "asc" } }, { sortOrder: "asc" }, { name: "asc" }],
  });
}

/** Active products whose slug/name match a query — powers country search. */
export function searchProducts(q: string, take = 8) {
  const term = q.trim();
  if (!term) return Promise.resolve([]);
  return prisma.product.findMany({
    where: {
      active: true,
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { slug: { contains: term.toLowerCase() } },
      ],
    },
    include: { region: true },
    take,
    orderBy: { name: "asc" },
  });
}

/** Look up active products by slug for server-side cart/checkout pricing. */
export function getProductsBySlugs(slugs: string[]) {
  return prisma.product.findMany({
    where: { slug: { in: slugs }, active: true },
  });
}

/** Approved first-party reviews for the reviews page. */
export function getApprovedReviews(take = 30) {
  return prisma.review.findMany({
    where: { approved: true },
    orderBy: { createdAt: "desc" },
    take,
  });
}

/** All active product + region slugs for the sitemap. */
export async function getSitemapEntries() {
  const [regions, products] = await Promise.all([
    prisma.region.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.product.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);
  return { regions, products };
}

/** Aggregate approved-review stats for the home strip (#21). */
export async function getReviewStats(): Promise<{ count: number; average: number }> {
  const [count, agg] = await Promise.all([
    prisma.review.count({ where: { approved: true } }),
    prisma.review.aggregate({ where: { approved: true }, _avg: { rating: true } }),
  ]);
  return { count, average: agg._avg.rating ?? 5 };
}

/** Flattened reviewer-attached photos, newest first — for the home strip (#21). */
export async function getReviewPhotos(take = 5): Promise<string[]> {
  const reviews = await prisma.review.findMany({
    where: { approved: true },
    orderBy: { createdAt: "desc" },
    select: { photos: true, imageUrl: true },
  });
  const urls: string[] = [];
  for (const r of reviews) {
    for (const p of r.photos) urls.push(p);
    if (r.imageUrl) urls.push(r.imageUrl);
  }
  return [...new Set(urls)].slice(0, take);
}
