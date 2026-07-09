import type { Metadata } from "next";
import { CONTACT_LINKS, SITE, SOCIAL_LINKS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with GlobeCase — WhatsApp, Telegram, Instagram, TikTok or email.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const channels = [...CONTACT_LINKS, ...SOCIAL_LINKS];
  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-xl text-center">
        <h1 className="font-display text-3xl uppercase tracking-wide sm:text-4xl">Contact Us</h1>
        <p className="mt-3 text-ink-soft">
          Questions about your order or a custom design? We usually reply within a day.
        </p>

        <div className="mt-8 grid gap-3">
          {channels.map((s) => (
            <a
              key={s.name}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="card flex items-center justify-between p-4 transition hover:shadow-md"
            >
              <span className="font-medium">{s.name}</span>
              <span className="font-semibold text-brand">Open →</span>
            </a>
          ))}
        </div>

        <p className="mt-8 text-sm text-ink-soft">
          Prefer email? Write to{" "}
          <a href={`mailto:${SITE.supportEmail}`} className="font-medium text-brand underline">
            {SITE.supportEmail}
          </a>
          .
        </p>
      </div>
    </div>
  );
}
