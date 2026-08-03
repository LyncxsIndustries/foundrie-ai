-- AlterTable
ALTER TABLE "ConversationMessage" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "replyToId" TEXT;

-- CreateTable
CREATE TABLE "RequirementsBackup" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "requirementsId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "runId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequirementsBackup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskProgressLog" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "progress" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskProgressLog_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TaskProgressLog_progress_check" CHECK (progress >= 0 AND progress <= 100)
);

-- CreateIndex
CREATE INDEX "RequirementsBackup_projectId_idx" ON "RequirementsBackup"("projectId");

-- CreateIndex
CREATE INDEX "RequirementsBackup_requirementsId_idx" ON "RequirementsBackup"("requirementsId");

-- CreateIndex
CREATE INDEX "RequirementsBackup_createdAt_idx" ON "RequirementsBackup"("createdAt");

-- CreateIndex
CREATE INDEX "TaskProgressLog_taskId_idx" ON "TaskProgressLog"("taskId");

-- CreateIndex
CREATE INDEX "TaskProgressLog_projectId_timestamp_idx" ON "TaskProgressLog"("projectId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "TaskProgressLog_projectId_taskType_timestamp_idx" ON "TaskProgressLog"("projectId", "taskType", "timestamp" DESC);

-- AddForeignKey
ALTER TABLE "ConversationMessage" ADD CONSTRAINT "ConversationMessage_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "ConversationMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "RequirementsBackup" ADD CONSTRAINT "RequirementsBackup_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementsBackup" ADD CONSTRAINT "RequirementsBackup_requirementsId_fkey" FOREIGN KEY ("requirementsId") REFERENCES "Requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskProgressLog" ADD CONSTRAINT "TaskProgressLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
