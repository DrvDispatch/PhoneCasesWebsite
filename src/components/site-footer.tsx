import Link from "next/link";
import { CONTACT_LINKS, FOOTER_LINKS, SITE, SOCIAL_LINKS } from "@/lib/site";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 bg-brand-dark text-white/85">
      <div className="container-page grid gap-10 py-14 md:grid-cols-3">
        <div>
          <p className="font-display text-lg font-semibold">
            Globe<span className="text-accent">Case</span>
          </p>
          <p className="mt-3 max-w-xs text-sm text-white/70">{SITE.description}</p>

          <h2 className="mt-5 font-display text-xs uppercase tracking-wide text-white/80">
            Social media
          </h2>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {SOCIAL_LINKS.map((s) => (
              <li key={s.name}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 transition hover:text-white"
                >
                  {s.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label="Footer" className="md:justify-self-center">
          <h2 className="font-display text-sm uppercase tracking-wide text-white">Company</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {FOOTER_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-white/70 transition hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div id="contact" className="md:justify-self-end">
          <h2 className="font-display text-sm uppercase tracking-wide text-white">Contact</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {CONTACT_LINKS.map((s) => (
              <li key={s.name}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 transition hover:text-white"
                >
                  {s.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="container-page py-5 text-center text-xs text-white/55">
          © {year} {SITE.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
