-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserPlan" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DISCOVERY', 'REQUIREMENTS', 'ARCHITECTURE', 'DIAGRAM_GENERATION', 'SPEC_GENERATION', 'COMPLETE');

-- CreateEnum
CREATE TYPE "ConversationPhase" AS ENUM ('DISCOVERY', 'REQUIREMENTS', 'ARCHITECTURE', 'DIAGRAM_GENERATION', 'SPEC_GENERATION', 'COMPLETE');

-- CreateEnum
CREATE TYPE "DiagramStatus" AS ENUM ('QUEUED', 'GENERATING', 'RENDERING', 'CAPTURING', 'DONE', 'ERROR');

-- CreateEnum
CREATE TYPE "ContextFileType" AS ENUM ('PROJECT_OVERVIEW', 'ARCHITECTURE_CONTEXT', 'UI_CONTEXT', 'CODE_STANDARDS', 'AI_WORKFLOW_RULES', 'PROGRESS_TRACKER');

-- CreateEnum
CREATE TYPE "ResearchAssetType" AS ENUM ('IMAGE_ASSET', 'SCREENSHOT', 'INSPIRATION', 'DOCUMENT', 'FRAME_ZIP', 'FRAME', 'SCRAPE_CAPTURE');

-- CreateEnum
CREATE TYPE "ResearchSourceProvider" AS ENUM ('MANUAL', 'CONTEXT7', 'TAVILY', 'OBSCURA', 'UPLOAD_DERIVED');

-- CreateEnum
CREATE TYPE "ResearchSourceStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ExecutionPlanStatus" AS ENUM ('PROPOSED', 'APPROVED', 'REVISION_REQUESTED', 'REJECTED', 'EXECUTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "plan" "UserPlan" NOT NULL DEFAULT 'FREE',
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "stripeCustomerId" TEXT,
    "subscriptionPlan" TEXT,
    "subscriptionStatus" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'DISCOVERY',
    "diagramCount" INTEGER NOT NULL DEFAULT 0,
    "completedDiagramCount" INTEGER NOT NULL DEFAULT 0,
    "featureSpecCount" INTEGER NOT NULL DEFAULT 0,
    "lastZipUrl" TEXT,
    "lastZipFileName" TEXT,
    "lastZipGeneratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "phase" "ConversationPhase" NOT NULL DEFAULT 'DISCOVERY',
    "messages" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Requirements" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "content" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diagram" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "diagramTypeId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "folderPath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "orderInCategory" INTEGER NOT NULL DEFAULT 0,
    "status" "DiagramStatus" NOT NULL DEFAULT 'QUEUED',
    "version" INTEGER NOT NULL DEFAULT 1,
    "reactFlowData" JSONB,
    "pngStorageUrl" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Diagram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContextFile" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fileType" "ContextFileType" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContextFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureSpec" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureSpec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchDocument" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchAsset" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "assetType" "ResearchAssetType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchSource" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "provider" "ResearchSourceProvider" NOT NULL,
    "status" "ResearchSourceStatus" NOT NULL DEFAULT 'PENDING',
    "url" TEXT NOT NULL,
    "extractedContent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectAgentSkill" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectAgentSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutionPlan" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "status" "ExecutionPlanStatus" NOT NULL DEFAULT 'PROPOSED',
    "content" TEXT NOT NULL,
    "revisionNotes" TEXT,
    "approvedAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExecutionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");

-- CreateIndex
CREATE INDEX "Project_userId_updatedAt_idx" ON "Project"("userId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Project_slug_idx" ON "Project"("slug");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_projectId_key" ON "Conversation"("projectId");

-- CreateIndex
CREATE INDEX "Conversation_projectId_phase_idx" ON "Conversation"("projectId", "phase");

-- CreateIndex
CREATE INDEX "Conversation_projectId_updatedAt_idx" ON "Conversation"("projectId", "updatedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Requirements_projectId_key" ON "Requirements"("projectId");

-- CreateIndex
CREATE INDEX "Diagram_projectId_idx" ON "Diagram"("projectId");

-- CreateIndex
CREATE INDEX "Diagram_projectId_category_orderInCategory_idx" ON "Diagram"("projectId", "category", "orderInCategory");

-- CreateIndex
CREATE INDEX "ContextFile_projectId_fileType_idx" ON "ContextFile"("projectId", "fileType");

-- CreateIndex
CREATE UNIQUE INDEX "ContextFile_projectId_fileType_key" ON "ContextFile"("projectId", "fileType");

-- CreateIndex
CREATE INDEX "FeatureSpec_projectId_order_idx" ON "FeatureSpec"("projectId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureSpec_projectId_order_key" ON "FeatureSpec"("projectId", "order");

-- CreateIndex
CREATE INDEX "ResearchDocument_projectId_idx" ON "ResearchDocument"("projectId");

-- CreateIndex
CREATE INDEX "ResearchDocument_projectId_sourceType_idx" ON "ResearchDocument"("projectId", "sourceType");

-- CreateIndex
CREATE INDEX "ResearchAsset_projectId_idx" ON "ResearchAsset"("projectId");

-- CreateIndex
CREATE INDEX "ResearchAsset_projectId_assetType_idx" ON "ResearchAsset"("projectId", "assetType");

-- CreateIndex
CREATE INDEX "ResearchSource_projectId_idx" ON "ResearchSource"("projectId");

-- CreateIndex
CREATE INDEX "ResearchSource_projectId_provider_idx" ON "ResearchSource"("projectId", "provider");

-- CreateIndex
CREATE INDEX "ResearchSource_projectId_status_idx" ON "ResearchSource"("projectId", "status");

-- CreateIndex
CREATE INDEX "ProjectAgentSkill_projectId_idx" ON "ProjectAgentSkill"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectAgentSkill_projectId_slug_key" ON "ProjectAgentSkill"("projectId", "slug");

-- CreateIndex
CREATE INDEX "ExecutionPlan_projectId_idx" ON "ExecutionPlan"("projectId");

-- CreateIndex
CREATE INDEX "ExecutionPlan_projectId_status_idx" ON "ExecutionPlan"("projectId", "status");

-- CreateIndex
CREATE INDEX "ExecutionPlan_projectId_taskType_idx" ON "ExecutionPlan"("projectId", "taskType");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirements" ADD CONSTRAINT "Requirements_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diagram" ADD CONSTRAINT "Diagram_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContextFile" ADD CONSTRAINT "ContextFile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureSpec" ADD CONSTRAINT "FeatureSpec_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchDocument" ADD CONSTRAINT "ResearchDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchAsset" ADD CONSTRAINT "ResearchAsset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchSource" ADD CONSTRAINT "ResearchSource_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAgentSkill" ADD CONSTRAINT "ProjectAgentSkill_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutionPlan" ADD CONSTRAINT "ExecutionPlan_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

