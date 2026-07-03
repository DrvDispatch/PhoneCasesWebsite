import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <p className="font-display text-6xl text-accent">404</p>
      <h1 className="mt-4 font-display text-3xl uppercase tracking-wide">Page not found</h1>
      <p className="mt-3 text-ink-soft">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link href="/shop" className="btn btn-primary mt-8">
        Browse the shop
      </Link>
    </div>
  );
}
