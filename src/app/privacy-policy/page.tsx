import type { Metadata } from "next";
import { CmsPage, getCmsPage } from "@/components/cms-page";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const p = await getCmsPage("privacy-policy");
  return {
    title: p?.title ?? "Privacy Policy",
    description: "How GlobeCase collects, uses and protects your personal data.",
    alternates: { canonical: "/privacy-policy" },
  };
}

export default function Page() {
  return <CmsPage slug="privacy-policy" />;
}
