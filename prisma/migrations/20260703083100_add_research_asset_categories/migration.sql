-- AlterTable
ALTER TABLE "ResearchAsset" ADD COLUMN     "category" TEXT,
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "aiDescription" TEXT,
ADD COLUMN     "extractedText" TEXT;

-- CreateIndex
CREATE INDEX "ResearchAsset_projectId_category_idx" ON "ResearchAsset"("projectId", "category");

-- CreateIndex
CREATE INDEX "ResearchAsset_projectId_order_idx" ON "ResearchAsset"("projectId", "order");
