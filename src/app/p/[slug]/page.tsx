import type { Metadata } from "next";
import { CmsPage, getCmsPage } from "@/components/cms-page";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = await getCmsPage(slug);
  if (!p) return { title: "Page not found" };
  return { title: p.title, alternates: { canonical: `/p/${slug}` } };
}

export default async function CustomPage({ params }: Params) {
  const { slug } = await params;
  return <CmsPage slug={slug} />;
}
