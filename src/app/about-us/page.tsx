import type { Metadata } from "next";
import { CmsPage, getCmsPage } from "@/components/cms-page";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const p = await getCmsPage("about-us");
  return {
    title: p?.title ?? "About Us",
    description:
      "GlobeCase makes culturally inspired phone cases celebrating heritage from around the world.",
    alternates: { canonical: "/about-us" },
  };
}

export default function Page() {
  return <CmsPage slug="about-us" />;
}
