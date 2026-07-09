import { TRUST_BADGES } from "@/lib/site";
import { TRUST_ICONS } from "@/components/icons";

export function TrustBadges() {
  return (
    <section aria-label="Why shop with us" className="border-y border-line bg-surface-alt">
      <div className="container-page grid grid-cols-1 gap-5 py-7 sm:grid-cols-3 sm:py-8">
        {TRUST_BADGES.map((b) => {
          const Icon = TRUST_ICONS[b.icon];
          return (
            <div
              key={b.title}
              className="flex items-center justify-center gap-3 sm:justify-start"
            >
              <Icon className="h-7 w-7 shrink-0 text-accent" />
              <div>
                <p className="text-sm font-semibold">{b.title}</p>
                <p className="text-xs text-ink-soft">{b.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
