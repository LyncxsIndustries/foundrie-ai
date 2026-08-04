-- Feature 64: Discovery Chat State & Logic with Versioning
-- Add completion tracking and versioning to Conversation model

-- Add completion tracking fields to Conversation
ALTER TABLE "Conversation" ADD COLUMN "isDone" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Conversation" ADD COLUMN "messageCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Conversation" ADD COLUMN "completionReason" TEXT;
ALTER TABLE "Conversation" ADD COLUMN "currentVersion" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Conversation" ADD COLUMN "activeVersionId" TEXT;

-- Create ConversationSnapshot table for versioning
CREATE TABLE "ConversationSnapshot" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "messageCount" INTEGER NOT NULL,
    "snapshotReason" TEXT NOT NULL,
    "label" TEXT,
    "messageIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationSnapshot_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
ALTER TABLE "ConversationSnapshot" ADD CONSTRAINT "ConversationSnapshot_conversationId_fkey" 
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create unique constraint for version per conversation
ALTER TABLE "ConversationSnapshot" ADD CONSTRAINT "ConversationSnapshot_conversationId_version_key" 
    UNIQUE ("conversationId", "version");

-- Create indexes for efficient querying
CREATE INDEX "Conversation_projectId_isDone_idx" ON "Conversation"("projectId", "isDone");
CREATE INDEX "ConversationSnapshot_conversationId_version_idx" ON "ConversationSnapshot"("conversationId", "version");
