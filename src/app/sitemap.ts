import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/lib/queries";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/shop",
    "/reviews",
    "/contact",
    "/about-us",
    "/return-policy",
    "/privacy-policy",
    "/terms-and-conditions",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.6,
  }));

  try {
    const { regions, products } = await getSitemapEntries();
    const regionRoutes: MetadataRoute.Sitemap = regions.map((r) => ({
      url: `${SITE_URL}/region/${r.slug}`,
      lastModified: r.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
    const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${SITE_URL}/product/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
    return [...staticRoutes, ...regionRoutes, ...productRoutes];
  } catch {
    // DB unavailable at build — ship at least the static routes.
    return staticRoutes;
  }
}
