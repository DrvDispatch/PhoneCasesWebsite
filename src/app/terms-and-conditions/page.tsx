import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms governing your use of GlobeCase and purchases from our store.",
  alternates: { canonical: "/terms-and-conditions" },
};

export default function TermsPage() {
  return (
    <div className="container-page py-14">
      <article className="legal">
        <h1 className="font-display text-4xl uppercase tracking-wide">Terms &amp; Conditions</h1>
        <p>
          By using {SITE.name} and placing an order, you agree to these terms. Please read them
          carefully.
        </p>
        <h2>Orders</h2>
        <p>
          All orders are subject to acceptance and availability. Prices are shown in euros and
          include applicable taxes where required. Cases are produced to order based on the device
          you specify at checkout — please make sure it is correct.
        </p>
        <h2>Payment</h2>
        <p>
          Payments are handled securely by Stripe (supporting card, PayPal and Klarna where
          available). We do not store your card details.
        </p>
        <h2>Shipping &amp; returns</h2>
        <p>
          Worldwide shipping is free. See our Return Policy for details on returns and refunds.
        </p>
        <h2>Liability</h2>
        <p>
          To the extent permitted by law, {SITE.name} is not liable for indirect or consequential
          losses arising from use of the site or products.
        </p>
        <h2>Contact</h2>
        <p>
          Questions? Email <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>.
        </p>
        <p className="text-xs">These terms are a template — please have them reviewed before launch.</p>
      </article>
    </div>
  );
}
