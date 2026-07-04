import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageForm } from "../../page-form";
import { updatePage } from "../../actions";

export const dynamic = "force-dynamic";

const RESERVED = new Set(["about-us", "return-policy", "privacy-policy", "terms-and-conditions"]);

type Params = { params: Promise<{ id: string }> };

export default async function EditPage({ params }: Params) {
  const { id } = await params;
  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) notFound();

  return (
    <div>
      <Link href="/admin/pages" className="text-sm text-ink-soft">
        ← Pages
      </Link>
      <h1 className="mt-2 font-display text-2xl">Edit: {page.title}</h1>
      <div className="mt-6">
        <PageForm
          action={updatePage.bind(null, page.id)}
          values={{ slug: page.slug, title: page.title, body: page.body, published: page.published }}
          submitLabel="Save changes"
          lockSlug={RESERVED.has(page.slug)}
        />
      </div>
    </div>
  );
}
