import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Return Policy",
  description: "GlobeCase 7-day return policy for made-to-order phone cases.",
  alternates: { canonical: "/return-policy" },
};

export default function ReturnPolicyPage() {
  return (
    <div className="container-page py-14">
      <article className="legal">
        <h1 className="font-display text-4xl uppercase tracking-wide">Return Policy</h1>
        <p>
          We want you to love your GlobeCase. If something isn&apos;t right, you may return an item
          within <strong>7 days</strong> of delivery.
        </p>
        <h2>Eligibility</h2>
        <ul>
          <li>Item must be unused and in its original condition and packaging.</li>
          <li>Made-to-order cases can be returned if faulty, damaged, or incorrect.</li>
          <li>Proof of purchase (order number) is required.</li>
        </ul>
        <h2>How to start a return</h2>
        <p>
          Email <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a> with your order
          number and the reason for return. We&apos;ll send instructions within one business day.
        </p>
        <h2>Refunds</h2>
        <p>
          Approved refunds are issued to your original payment method within 5–10 business days of
          us receiving the returned item.
        </p>
        <p className="text-xs">This policy is a template — please have it reviewed before launch.</p>
      </article>
    </div>
  );
}
