"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { setSetting, SETTING_KEYS } from "@/lib/settings";

export async function saveSettings(formData: FormData) {
  await requireAdmin();
  await setSetting(SETTING_KEYS.googleMapsUrl, String(formData.get("googleMapsUrl") ?? "").trim());
  await setSetting(SETTING_KEYS.homeReviewPhotos, String(formData.get("homeReviewPhotos") ?? "").trim());
  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/reviews");
}
