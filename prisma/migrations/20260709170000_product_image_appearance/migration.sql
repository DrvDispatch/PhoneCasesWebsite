-- Per-product image appearance controls (fit / zoom / background)
ALTER TABLE "Product" ADD COLUMN "imageFit" TEXT NOT NULL DEFAULT 'contain';
ALTER TABLE "Product" ADD COLUMN "imageScale" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "Product" ADD COLUMN "imageBg" TEXT NOT NULL DEFAULT '#f7f8f9';
