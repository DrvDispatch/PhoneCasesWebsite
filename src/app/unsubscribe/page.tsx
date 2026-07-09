import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = { title: "Unsubscribe", robots: { index: false } };

type Params = { searchParams: Promise<{ token?: string }> };

export default async function UnsubscribePage({ searchParams }: Params) {
  const { token } = await searchParams;
  let done = false;

  if (token) {
    const sub = await prisma.subscriber.findUnique({ where: { unsubToken: token } });
    if (sub) {
      if (sub.active) {
        await prisma.subscriber.update({ where: { id: sub.id }, data: { active: false } });
      }
      done = true;
    }
  }

  return (
    <div className="container-page py-20 text-center">
      <h1 className="font-display text-3xl uppercase tracking-wide">
        {done ? "You’re unsubscribed" : "Link not recognised"}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-ink-soft">
        {done
          ? "You won’t receive any more marketing emails from GlobeCase. Sorry to see you go!"
          : "We couldn’t find that unsubscribe link. It may have already been used."}
      </p>
      <Link href="/" className="btn btn-primary mt-6">
        Back to store
      </Link>
    </div>
  );
}
