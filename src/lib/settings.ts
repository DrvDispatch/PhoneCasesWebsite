import "server-only";
import { prisma } from "./db";

/** Site-wide key/value settings, editable in /admin/settings. */
export const SETTING_KEYS = {
  googleMapsUrl: "google_maps_url",
  /** Newline-separated image URLs for the home review strip (#21). */
  homeReviewPhotos: "home_review_photos",
} as const;

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany({ where: { key: { in: keys } } });
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function setSetting(key: string, value: string) {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

/** Split a textarea/CSV of URLs into a clean list. */
export function parseUrlList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
