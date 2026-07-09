import { prisma } from "@/lib/db";
import { ReviewForm } from "./review-form";
import { deleteReview, toggleReview } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl">Reviews ({reviews.length})</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Add reviews and attach photos (e.g. from Google). Set your Google Maps link under Settings.
        </p>
      </div>

      <section className="card p-5">
        <h2 className="font-display text-lg">New review</h2>
        <div className="mt-4">
          <ReviewForm />
        </div>
      </section>

      <ul className="space-y-3">
        {reviews.map((r) => (
          <li key={r.id} className="card flex items-start gap-4 p-4">
            {r.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.imageUrl} alt="" className="h-16 w-16 flex-none rounded-lg border border-line object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-medium">{r.author}</span>{" "}
                <span className="text-accent">{"★".repeat(r.rating)}</span>
                {!r.approved && <span className="ml-2 text-xs text-ink-soft">(hidden)</span>}
              </p>
              <p className="mt-1 text-sm text-ink-soft">{r.body}</p>
            </div>
            <div className="flex flex-none flex-col items-end gap-1 text-sm">
              <form action={toggleReview.bind(null, r.id)}>
                <button className="text-accent">{r.approved ? "Hide" : "Approve"}</button>
              </form>
              <form action={deleteReview.bind(null, r.id)}>
                <button className="text-danger">Delete</button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
