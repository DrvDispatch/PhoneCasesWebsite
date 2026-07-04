import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export function getCmsPage(slug: string) {
  return prisma.page.findFirst({ where: { slug, published: true } });
}

/** Renders an editable CMS page (admin-authored HTML is trusted). */
export async function CmsPage({ slug }: { slug: string }) {
  const page = await getCmsPage(slug);
  if (!page) notFound();
  return (
    <div className="container-page py-14">
      <article className="legal">
        <h1 className="font-display text-4xl uppercase tracking-wide">{page.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: page.body }} />
      </article>
    </div>
  );
}
