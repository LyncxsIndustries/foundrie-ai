-- Feature 53: Dynamic Phase Completion Detection
-- Add project complexity classification and phase completion tracking

-- Create ProjectComplexity enum
CREATE TYPE "ProjectComplexity" AS ENUM ('SIMPLE', 'STANDARD', 'COMPLEX');

-- Add complexity and phase tracking fields to Project
ALTER TABLE "Project" ADD COLUMN "complexity" "ProjectComplexity" NOT NULL DEFAULT 'STANDARD';
ALTER TABLE "Project" ADD COLUMN "estimatedPhases" INTEGER NOT NULL DEFAULT 8;
ALTER TABLE "Project" ADD COLUMN "estimatedMessages" INTEGER NOT NULL DEFAULT 20;
ALTER TABLE "Project" ADD COLUMN "requiredPhases" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Project" ADD COLUMN "phaseCompletions" JSONB;

-- Add phase completion tracking to Conversation
ALTER TABLE "Conversation" ADD COLUMN "phaseCompletionData" JSONB;
ALTER TABLE "Conversation" ADD COLUMN "autoAdvanced" BOOLEAN NOT NULL DEFAULT false;
