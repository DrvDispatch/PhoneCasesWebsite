-- Reviewer avatar + attached photos + display date (Google reviews)
ALTER TABLE "Review" ADD COLUMN "avatarUrl" TEXT;
ALTER TABLE "Review" ADD COLUMN "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Review" ADD COLUMN "dateLabel" TEXT;
