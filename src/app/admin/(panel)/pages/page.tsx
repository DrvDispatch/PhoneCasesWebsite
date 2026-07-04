import Link from "next/link";
import { prisma } from "@/lib/db";
import { deletePage } from "./actions";

export const dynamic = "force-dynamic";

const RESERVED = new Set(["about-us", "return-policy", "privacy-policy", "terms-and-conditions"]);

export default async function AdminPagesPage() {
  const pages = await prisma.page.findMany({ orderBy: { slug: "asc" } });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Pages ({pages.length})</h1>
        <Link href="/admin/pages/new" className="btn btn-primary">
          + New page
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt text-left text-ink-soft">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">URL</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => {
              const url = RESERVED.has(p.slug) ? `/${p.slug}` : `/p/${p.slug}`;
              return (
                <tr key={p.id} className="border-t border-line-soft">
                  <td className="px-4 py-3 font-medium">{p.title}</td>
                  <td className="px-4 py-3">
                    <a href={url} target="_blank" rel="noreferrer" className="text-accent">
                      {url}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <span className={p.published ? "text-success" : "text-ink-soft"}>
                      {p.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/pages/${p.id}/edit`} className="text-accent">
                      Edit
                    </Link>
                    {!RESERVED.has(p.slug) && (
                      <form action={deletePage.bind(null, p.id)} className="inline">
                        <button className="ml-3 text-danger">Delete</button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
