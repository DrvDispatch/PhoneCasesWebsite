import { TRUST_BADGES } from "@/lib/site";

export function TrustBadges() {
  return (
    <section aria-label="Why shop with us" className="border-y border-line bg-surface-alt">
      <div className="container-page grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
        {TRUST_BADGES.map((b) => (
          <div key={b.title} className="flex items-start gap-3">
            <span aria-hidden className="text-2xl">
              {b.icon}
            </span>
            <div>
              <p className="text-sm font-semibold">{b.title}</p>
              <p className="text-xs text-ink-soft">{b.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
