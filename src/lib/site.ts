/** Central site configuration — brand copy, nav, socials, contact. */
export const SITE = {
  name: "GlobeCase",
  tagline: "Phone Cases by Region",
  description:
    "Country & flag phone cases celebrating your heritage — designs across the Caucasus, Balkans, Europe, Asia, Africa and the Americas. Made to order for any iPhone or Android. Worldwide free shipping and 7-day returns.",
  locale: "en_IE",
  supportEmail: "support@globe-case.com",
  whatsapp:
    "https://wa.me/32488592446?text=Hi%20there%21%20I%E2%80%99m%20interested%20in%20one%20of%20your%20products",
  // TODO: confirm the real Telegram handle with the client (placeholder for now).
  telegram: "https://t.me/globecase",
};

export const MAIN_NAV = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Reviews", href: "/reviews" },
  { label: "Contact", href: "/contact" },
];

export const FOOTER_LINKS = [
  { label: "Return Policy", href: "/return-policy" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "About Us", href: "/about-us" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
];

/** Social profiles — shown under "Social media" in the footer. */
export const SOCIAL_LINKS = [
  { name: "TikTok", href: "https://www.tiktok.com/@globecase.official" },
  { name: "Instagram", href: "https://www.instagram.com/globecase.official" },
];

/** Direct contact channels — shown under "Contact" in the footer. */
export const CONTACT_LINKS = [
  { name: "WhatsApp", href: SITE.whatsapp },
  { name: "Telegram", href: SITE.telegram },
  { name: "Email", href: `mailto:${SITE.supportEmail}` },
];

export const TRUST_BADGES: { icon: "globe" | "returns" | "secure"; title: string; text: string }[] = [
  { icon: "globe", title: "Worldwide free shipping", text: "On every order, everywhere." },
  { icon: "returns", title: "7-day returns", text: "Not right? Send it back." },
  { icon: "secure", title: "Secure checkout", text: "Stripe · PayPal · Klarna." },
];
