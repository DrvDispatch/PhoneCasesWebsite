import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How GlobeCase collects, uses and protects your personal data.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container-page py-14">
      <article className="legal">
        <h1 className="font-display text-4xl uppercase tracking-wide">Privacy Policy</h1>
        <p>
          GlobeCase respects your privacy. This policy explains what we collect and why, in line
          with the GDPR.
        </p>
        <h2>What we collect</h2>
        <ul>
          <li>Order details: name, email, shipping address, and the device model you specify.</li>
          <li>Payment is processed by Stripe — we never store your full card number.</li>
          <li>Basic, privacy-friendly analytics to understand site usage.</li>
        </ul>
        <h2>How we use it</h2>
        <ul>
          <li>To fulfil and ship your order and provide support.</li>
          <li>To send order confirmations and, if you opt in, occasional updates.</li>
        </ul>
        <h2>Your rights</h2>
        <p>
          You can request access to, correction of, or deletion of your data at any time by
          emailing <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>.
        </p>
        <h2>Third parties</h2>
        <p>We share data only with providers needed to run the store (e.g. Stripe, shipping carriers).</p>
        <p className="text-xs">This policy is a template — please have it reviewed before launch.</p>
      </article>
    </div>
  );
}
