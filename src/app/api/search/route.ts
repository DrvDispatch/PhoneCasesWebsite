import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/queries";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`search:${ip}`, 60, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (q.trim().length === 0 || q.length > 60) return NextResponse.json([]);

  const products = await searchProducts(q, 8);
  return NextResponse.json(
    products.map((p) => ({ slug: p.slug, name: p.name, regionName: p.region.name })),
  );
}
