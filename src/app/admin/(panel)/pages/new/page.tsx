import Link from "next/link";
import { PageForm } from "../page-form";
import { createPage } from "../actions";

export const dynamic = "force-dynamic";

export default function NewPage() {
  return (
    <div>
      <Link href="/admin/pages" className="text-sm text-ink-soft">
        ← Pages
      </Link>
      <h1 className="mt-2 font-display text-2xl">New page</h1>
      <div className="mt-6">
        <PageForm action={createPage} submitLabel="Create page" />
      </div>
    </div>
  );
}
