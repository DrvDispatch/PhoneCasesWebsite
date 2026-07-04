import type { Metadata } from "next";
import { CmsPage, getCmsPage } from "@/components/cms-page";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const p = await getCmsPage("return-policy");
  return {
    title: p?.title ?? "Return Policy",
    description: "GlobeCase 7-day return policy for made-to-order phone cases.",
    alternates: { canonical: "/return-policy" },
  };
}

export default function Page() {
  return <CmsPage slug="return-policy" />;
}
