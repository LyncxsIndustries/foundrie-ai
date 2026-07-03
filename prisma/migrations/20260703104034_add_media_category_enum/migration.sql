/*
  Warnings:

  - The `category` column on the `ResearchAsset` table is being migrated from String to Enum.
  - Existing category values will be transformed to match the new enum.

*/
-- CreateEnum
CREATE TYPE "MediaCategory" AS ENUM ('INSPIRATION', 'WIREFRAMES', 'BRANDING', 'TECHNICAL_DOCS', 'COMPETITORS', 'GENERAL');

-- AlterEnum
ALTER TYPE "ResearchSourceProvider" ADD VALUE 'GITHUB';

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "requiredPhases" DROP DEFAULT;

-- Migrate existing category data to uppercase enum format
-- First, update existing lowercase/kebab-case values to enum format
UPDATE "ResearchAsset"
SET category = CASE
  WHEN category = 'inspiration' THEN 'INSPIRATION'
  WHEN category = 'wireframes' THEN 'WIREFRAMES'
  WHEN category = 'branding' THEN 'BRANDING'
  WHEN category = 'technical-docs' THEN 'TECHNICAL_DOCS'
  WHEN category = 'competitors' THEN 'COMPETITORS'
  WHEN category = 'general' THEN 'GENERAL'
  WHEN category IN ('INSPIRATION', 'WIREFRAMES', 'BRANDING', 'TECHNICAL_DOCS', 'COMPETITORS', 'GENERAL') THEN category
  ELSE 'GENERAL'  -- Default any other values to GENERAL
END
WHERE category IS NOT NULL;

-- Now safely convert the column type
ALTER TABLE "ResearchAsset" 
  ALTER COLUMN "category" TYPE "MediaCategory" USING (category::"MediaCategory");

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "githubInstallationId" INTEGER;

-- CreateTable
CREATE TABLE "DiagramVersion" (
    "id" TEXT NOT NULL,
    "diagramId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "reactFlowData" JSONB,
    "pngStorageUrl" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagramVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DiagramVersion_diagramId_idx" ON "DiagramVersion"("diagramId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "DiagramVersion_diagramId_version_key" ON "DiagramVersion"("diagramId", "version");

-- CreateIndex (already exists from previous migration, skip if exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'ResearchAsset_projectId_category_idx'
    ) THEN
        CREATE INDEX "ResearchAsset_projectId_category_idx" ON "ResearchAsset"("projectId", "category");
    END IF;
END $$;

-- AddForeignKey
ALTER TABLE "DiagramVersion" ADD CONSTRAINT "DiagramVersion_diagramId_fkey" FOREIGN KEY ("diagramId") REFERENCES "Diagram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
