import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(req: Request) {
  // Admin only.
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only images are allowed" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image too large (max 8MB)" }, { status: 400 });
  }

  try {
    const input = Buffer.from(await file.arrayBuffer());
    // Re-encode to optimized webp (resize, strip metadata) for consistency + speed.
    const output = await sharp(input)
      .rotate()
      .resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    await mkdir(UPLOAD_DIR, { recursive: true });
    const name = `${randomUUID()}.webp`;
    await writeFile(path.join(UPLOAD_DIR, name), output);
    const url = `/uploads/${name}`;
    logger.info({ actor: session.email, url, bytes: output.length }, "admin image upload");
    return NextResponse.json({ url });
  } catch (err) {
    logger.error({ err }, "upload failed");
    return NextResponse.json({ error: "Could not process image" }, { status: 500 });
  }
}
