import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cell(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** Admin-only CSV export of active subscribers. */
export async function GET() {
  await requireAdmin(); // redirects to /admin/login if not authed

  const subs = await prisma.subscriber.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });

  const rows: string[][] = [
    ["email", "code", "subscribedAt"],
    ...subs.map((s) => [s.email, s.code ?? "", s.createdAt.toISOString()]),
  ];
  const csv = rows.map((r) => r.map(cell).join(",")).join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="globecase-subscribers.csv"',
    },
  });
}
