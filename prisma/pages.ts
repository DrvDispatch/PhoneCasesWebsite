/** Starter content for the editable CMS pages (admin can edit these live). */
export const PAGES: { slug: string; title: string; body: string }[] = [
  {
    slug: "about-us",
    title: "About GlobeCase",
    body: `<p>GlobeCase started with a simple idea: your phone goes everywhere with you, so it should carry a piece of where you're from. We design culturally inspired cases celebrating regions and countries across the world.</p>
<h2>Made to order</h2>
<p>Every case is printed to order for your exact device, so it fits perfectly whether you carry the latest iPhone or an Android from any brand.</p>
<h2>Giving back</h2>
<p>We donate <strong>5% of every order</strong> to WWF and UNICEF.</p>
<h2>Worldwide, on us</h2>
<p>Shipping is free everywhere, and returns are easy within 7 days.</p>`,
  },
  {
    slug: "return-policy",
    title: "Return Policy",
    body: `<p>If something isn't right, you may return an item within <strong>7 days</strong> of delivery.</p>
<h2>Eligibility</h2>
<ul><li>Item must be unused and in its original condition and packaging.</li>
<li>Made-to-order cases can be returned if faulty, damaged, or incorrect.</li>
<li>Proof of purchase (order number) is required.</li></ul>
<h2>How to start a return</h2>
<p>Email us with your order number and reason for return. We'll send instructions within one business day.</p>
<h2>Refunds</h2>
<p>Approved refunds are issued to your original payment method within 5–10 business days of us receiving the returned item.</p>`,
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    body: `<p>GlobeCase respects your privacy. This policy explains what we collect and why, in line with the GDPR.</p>
<h2>What we collect</h2>
<ul><li>Order details: name, email, shipping address, and the device model you specify.</li>
<li>Payment is processed by Stripe — we never store your full card number.</li></ul>
<h2>Your rights</h2>
<p>You can request access to, correction of, or deletion of your data at any time by emailing us.</p>`,
  },
  {
    slug: "terms-and-conditions",
    title: "Terms & Conditions",
    body: `<p>By using GlobeCase and placing an order, you agree to these terms.</p>
<h2>Orders</h2>
<p>All orders are subject to acceptance and availability. Prices are shown in euros. Cases are produced to order based on the device you specify at checkout.</p>
<h2>Payment</h2>
<p>Payments are handled securely by Stripe (card, PayPal and Klarna where available).</p>
<h2>Shipping &amp; returns</h2>
<p>Worldwide shipping is free. See our Return Policy for details.</p>`,
  },
];
