import type { Metadata } from "next";
import { CmsPage, getCmsPage } from "@/components/cms-page";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const p = await getCmsPage("terms-and-conditions");
  return {
    title: p?.title ?? "Terms & Conditions",
    description: "The terms governing your use of GlobeCase and purchases from our store.",
    alternates: { canonical: "/terms-and-conditions" },
  };
}

export default function Page() {
  return <CmsPage slug="terms-and-conditions" />;
}
