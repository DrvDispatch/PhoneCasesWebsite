-- Product catalogue snapshots for backup / undo
CREATE TABLE "Snapshot" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "productCount" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Snapshot_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Snapshot_createdAt_idx" ON "Snapshot"("createdAt");
