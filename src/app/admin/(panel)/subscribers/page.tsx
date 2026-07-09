import { prisma } from "@/lib/db";
import { deleteSubscriber, toggleSubscriber } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminSubscribersPage() {
  const subs = await prisma.subscriber.findMany({ orderBy: { createdAt: "desc" } });
  const active = subs.filter((s) => s.active).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl">Newsletter subscribers ({subs.length})</h1>
          <p className="mt-1 text-sm text-ink-soft">{active} active · captured by the 5%-off signup.</p>
        </div>
        <a href="/api/admin/subscribers" className="btn btn-outline text-sm">
          Download CSV
        </a>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt text-left text-ink-soft">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink-soft">
                  No subscribers yet.
                </td>
              </tr>
            )}
            {subs.map((s) => (
              <tr key={s.id} className="border-t border-line-soft">
                <td className="px-4 py-3 font-medium">{s.email}</td>
                <td className="px-4 py-3 font-mono text-xs">{s.code ?? "—"}</td>
                <td className="px-4 py-3">{s.createdAt.toISOString().slice(0, 10)}</td>
                <td className="px-4 py-3">
                  <span className={s.active ? "text-success" : "text-ink-soft"}>
                    {s.active ? "Active" : "Unsubscribed"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={toggleSubscriber.bind(null, s.id)} className="inline">
                    <button className="text-brand">{s.active ? "Deactivate" : "Reactivate"}</button>
                  </form>
                  <form action={deleteSubscriber.bind(null, s.id)} className="inline">
                    <button className="ml-3 text-danger">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
