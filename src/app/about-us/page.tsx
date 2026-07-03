import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "GlobeCase makes culturally inspired phone cases celebrating heritage from around the world.",
  alternates: { canonical: "/about-us" },
};

export default function AboutPage() {
  return (
    <div className="container-page py-14">
      <article className="legal">
        <h1 className="font-display text-4xl uppercase tracking-wide">About GlobeCase</h1>
        <p>
          GlobeCase started with a simple idea: your phone goes everywhere with you, so it should
          carry a piece of where you&apos;re from. We design culturally inspired cases celebrating
          regions and countries across the world — from the Caucasus and the Balkans to Asia,
          Africa, Europe and the Americas.
        </p>
        <h2>Made to order</h2>
        <p>
          Every case is printed to order for your exact device, so it fits perfectly whether you
          carry the latest iPhone or an Android from any brand.
        </p>
        <h2>Giving back</h2>
        <p>
          We donate <strong>5% of every order</strong> to WWF and UNICEF — protecting the planet and
          supporting children worldwide.
        </p>
        <h2>Worldwide, on us</h2>
        <p>Shipping is free everywhere, and returns are easy within 7 days.</p>
      </article>
    </div>
  );
}
