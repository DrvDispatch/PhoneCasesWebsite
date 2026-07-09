import { listSnapshots } from "@/lib/snapshot";
import { backupNow, restoreAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function BackupsPage() {
  const snaps = await listSnapshots();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl">Backups</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft">
            A snapshot of your products is saved automatically <strong>before every AI change</strong>, so
            you can undo anything here. The full database is also backed up <strong>daily</strong> on the
            server (kept 14 days).
          </p>
        </div>
        <form action={backupNow}>
          <button className="btn btn-outline text-sm">Back up now</button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt text-left text-ink-soft">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">What</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3 text-right">Restore</th>
            </tr>
          </thead>
          <tbody>
            {snaps.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ink-soft">
                  No backups yet — they appear here automatically before any AI change.
                </td>
              </tr>
            )}
            {snaps.map((s) => (
              <tr key={s.id} className="border-t border-line-soft align-top">
                <td className="whitespace-nowrap px-4 py-3">
                  {s.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                </td>
                <td className="px-4 py-3 text-ink-soft">{s.label}</td>
                <td className="px-4 py-3">{s.productCount}</td>
                <td className="px-4 py-3 text-right">
                  <form action={restoreAction.bind(null, s.id)}>
                    <button className="font-medium text-brand">Restore</button>
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
