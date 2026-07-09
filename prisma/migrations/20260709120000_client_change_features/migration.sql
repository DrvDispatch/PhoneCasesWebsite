-- Client change features (#4, #6, #11, #13, #17, #18, #22)

-- Product: gallery already exists; add selectable design images (#13)
ALTER TABLE "Product" ADD COLUMN "designImages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- OrderItem: device brand + chosen design (#13/#18)
ALTER TABLE "OrderItem" ADD COLUMN "phoneBrand" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "designChoice" TEXT;

-- Order: discount + promo code (#4/#17)
ALTER TABLE "Order" ADD COLUMN "discountCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "promoCode" TEXT;

-- Review: optional photo (#11/#21)
ALTER TABLE "Review" ADD COLUMN "imageUrl" TEXT;

-- Discount kind enum
CREATE TYPE "DiscountKind" AS ENUM ('PERCENT', 'FIXED');

-- PromoCode (#4)
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "kind" "DiscountKind" NOT NULL DEFAULT 'PERCENT',
    "value" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "minSubtotalCents" INTEGER,
    "maxRedemptions" INTEGER,
    "timesRedeemed" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");
CREATE INDEX "PromoCode_active_idx" ON "PromoCode"("active");

-- Subscriber (#22)
CREATE TABLE "Subscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT,
    "unsubToken" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT DEFAULT 'popup',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subscriber_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Subscriber_email_key" ON "Subscriber"("email");
CREATE UNIQUE INDEX "Subscriber_unsubToken_key" ON "Subscriber"("unsubToken");
CREATE INDEX "Subscriber_active_idx" ON "Subscriber"("active");
