import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Checkout cancelled",
  robots: { index: false, follow: false },
};

export default function CancelPage() {
  return (
    <div className="container-page py-20">
      <div className="mx-auto max-w-lg text-center">
        <p className="text-5xl">🛒</p>
        <h1 className="mt-4 font-display text-3xl uppercase tracking-wide">Checkout cancelled</h1>
        <p className="mt-3 text-ink-soft">
          No worries — your cart is saved. Pick up where you left off whenever you&apos;re ready.
        </p>
        <Link href="/shop" className="btn btn-primary mt-8">
          Back to shop
        </Link>
      </div>
    </div>
  );
}
