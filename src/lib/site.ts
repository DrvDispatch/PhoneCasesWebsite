/** Central site configuration — brand copy, nav, socials, contact. */
export const SITE = {
  name: "GlobeCase",
  tagline: "Phone Cases by Region",
  description:
    "Culturally inspired phone cases organised by world region — Kavkaz, Europe, Balkan, Asia, Africa & America. Made to order for any device. Worldwide free shipping and 7-day returns.",
  locale: "en_IE",
  supportEmail: "globecase.mail@gmail.com",
  whatsapp: "https://wa.me/32488592446?text=Hi%20there%21%20I%E2%80%99m%20interested%20in%20one%20of%20your%20products",
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

export const SOCIAL_LINKS = [
  { name: "TikTok", href: "https://www.tiktok.com/@globecase.official" },
  { name: "Instagram", href: "https://www.instagram.com/globecase.official" },
  {
    name: "WhatsApp",
    href: "https://wa.me/32488592446?text=Hi%20there%21%20I%E2%80%99m%20interested%20in%20one%20of%20your%20products",
  },
  { name: "Email", href: "mailto:globecase.mail@gmail.com" },
];

export const TRUST_BADGES = [
  { icon: "🌍", title: "Worldwide free shipping", text: "On every order, everywhere." },
  { icon: "↩️", title: "7-day returns", text: "Not right? Send it back." },
  { icon: "💚", title: "5% donated", text: "To WWF & UNICEF, every order." },
  { icon: "🔒", title: "Secure checkout", text: "Stripe · PayPal · Klarna." },
];
