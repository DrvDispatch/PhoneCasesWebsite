import { IconShieldCheck } from "@/components/icons";

/**
 * Footer trust strip (#22): accepted-payment methods + a satisfaction guarantee,
 * echoing the "Accepted Payment / 100% Satisfaction Guaranteed" reference.
 * The labels mirror what Stripe Checkout actually accepts for this store.
 */
const METHODS: { label: string; color: string }[] = [
  { label: "VISA", color: "#1a1f71" },
  { label: "Mastercard", color: "#c8102e" },
  { label: "Amex", color: "#2e77bc" },
  { label: "PayPal", color: "#003087" },
  { label: "Klarna", color: "#d6336c" },
];

export function PaymentTrustBar() {
  return (
    <section aria-label="Payment and guarantee" className="border-t border-line bg-surface-alt">
      <div className="container-page flex flex-col items-center justify-between gap-6 py-8 sm:flex-row">
        <div className="text-center sm:text-left">
          <p className="text-sm font-semibold text-ink">Accepted payment</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            {METHODS.map((m) => (
              <span
                key={m.label}
                className="inline-flex h-7 items-center rounded-md border border-line bg-white px-2.5 text-[11px] font-bold uppercase tracking-wide shadow-sm"
                style={{ color: m.color }}
              >
                {m.label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 text-center sm:text-right">
          <IconShieldCheck className="h-9 w-9 shrink-0 text-accent" />
          <div className="text-left">
            <p className="text-sm font-semibold text-ink">100% Satisfaction Guaranteed</p>
            <p className="text-xs text-ink-soft">Not happy? 7-day returns, no questions asked.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
