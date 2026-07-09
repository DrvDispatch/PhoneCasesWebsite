import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "../actions";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/assistant", label: "✨ Assistant" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/discounts", label: "Discounts" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/subscribers", label: "Subscribers" },
  { href: "/admin/pages", label: "Pages" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="min-h-screen bg-surface-alt">
      <div className="mx-auto flex max-w-7xl flex-col md:flex-row">
        <aside className="border-b border-line bg-surface md:min-h-screen md:w-60 md:border-b-0 md:border-r">
          <div className="p-5">
            <Link href="/admin" className="font-display text-lg">
              Globe<span className="text-accent">Case</span>
            </Link>
            <p className="text-xs text-ink-soft">Admin</p>
          </div>
          <nav className="px-3">
            <ul className="space-y-1">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-ink transition hover:bg-surface-alt"
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-6 border-t border-line p-4">
            <p className="truncate text-xs text-ink-soft">{session.email}</p>
            <form action={logoutAction} className="mt-2">
              <button className="text-sm text-danger underline">Sign out</button>
            </form>
            <Link href="/" className="mt-3 block text-xs text-ink-soft underline">
              ← View store
            </Link>
          </div>
        </aside>

        <main className="flex-1 p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
