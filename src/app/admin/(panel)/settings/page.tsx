import { getSettings, SETTING_KEYS } from "@/lib/settings";
import { saveSettings } from "./actions";

export const dynamic = "force-dynamic";

const field =
  "mt-1 w-full rounded-xl border border-line px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

export default async function AdminSettingsPage() {
  const s = await getSettings([SETTING_KEYS.googleMapsUrl, SETTING_KEYS.homeReviewPhotos]);

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl">Settings</h1>
      <p className="mt-1 text-sm text-ink-soft">Storefront details you can change without code.</p>

      <form action={saveSettings} className="mt-6 space-y-6">
        <label className="block text-sm font-medium">
          Google Maps business link
          <input
            name="googleMapsUrl"
            type="url"
            defaultValue={s[SETTING_KEYS.googleMapsUrl] ?? ""}
            placeholder="https://maps.app.goo.gl/…"
            className={field}
          />
          <span className="mt-1 block text-xs text-ink-soft">
            Shown as a “See us on Google” button on the reviews section.
          </span>
        </label>

        <label className="block text-sm font-medium">
          Home review photos (one image URL per line, up to 5)
          <textarea
            name="homeReviewPhotos"
            rows={5}
            defaultValue={s[SETTING_KEYS.homeReviewPhotos] ?? ""}
            placeholder={"/uploads/review-1.webp\n/uploads/review-2.webp"}
            className={field}
          />
          <span className="mt-1 block text-xs text-ink-soft">
            Square photos shown in the home review strip. Upload them via a product/review image
            field, then paste the /uploads/… links here.
          </span>
        </label>

        <button type="submit" className="btn btn-dark">
          Save settings
        </button>
      </form>
    </div>
  );
}
