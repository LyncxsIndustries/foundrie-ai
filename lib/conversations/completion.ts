// Feature 64: Discovery Chat State & Logic - Completion and Versioning Helpers

import { db } from "@/lib/db";

export type CompletionReason = "user_generated_requirements" | "auto_completed" | "discarded";
export type SnapshotReason = "initial_completion" | "project_update";

export interface ConversationStatus {
  exists: true;
  isDone: boolean;
  messageCount: number;
  currentVersion: number;
  completionReason: CompletionReason | null;
  activeVersionId: string | null;
  hasSnapshots: boolean;
  isViewingSnapshot: boolean;
  snapshots: Array<{
    version: number;
    messageCount: number;
    label: string | null;
    snapshotReason: string;
    createdAt: Date;
  }>;
}

/**
 * Mark conversation as done and create a snapshot.
 */
export async function markConversationDone(
  projectId: string,
  reason: CompletionReason,
  label?: string
): Promise<{ success: true; version: number } | { success: false; error: string }> {
  try {
    const conversation = await db.conversation.findUnique({
      where: { projectId },
      select: {
        id: true,
        isDone: true,
        messageCount: true,
        currentVersion: true,
        conversationMessages: {
          where: { isActive: true },
          select: { id: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      return { success: false, error: "Conversation not found" };
    }

    if (conversation.isDone) {
      return { success: false, error: "Conversation already marked as done" };
    }

    const messageIds = conversation.conversationMessages.map(m => m.id);
    const version = conversation.currentVersion;

    // Create snapshot and mark as done in a transaction
    await db.$transaction(async (tx) => {
      // Create snapshot
      await tx.conversationSnapshot.create({
        data: {
          conversationId: conversation.id,
          version,
          messageCount: conversation.messageCount,
          snapshotReason: "initial_completion",
          label: label || null,
          messageIds,
        },
      });

      // Mark conversation as done
      await tx.conversation.update({
        where: { id: conversation.id },
        data: {
          isDone: true,
          completionReason: reason,
        },
      });
    });

    return { success: true, version };
  } catch (error) {
    console.error("[markConversationDone] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Resume a done conversation for updates (creates new version).
 */
export async function resumeConversationForUpdate(
  projectId: string
): Promise<{ success: true; newVersion: number } | { success: false; error: string }> {
  try {
    // Use serializable transaction to atomically allocate version numbers
    const result = await db.$transaction(async (tx) => {
      const conversation = await tx.conversation.findUnique({
        where: { projectId },
        select: {
          id: true,
          isDone: true,
          currentVersion: true,
        },
      });

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      if (!conversation.isDone) {
        throw new Error("Conversation is not done, cannot resume for update");
      }

      const newVersion = conversation.currentVersion + 1;

      // Atomically increment version and clear completion state
      await tx.conversation.update({
        where: { 
          id: conversation.id,
          currentVersion: conversation.currentVersion, // Optimistic lock
        },
        data: {
          isDone: false,
          completionReason: null,
          currentVersion: newVersion,
          activeVersionId: null, // Working on live messages now
        },
      });

      return { newVersion };
    }, {
      isolationLevel: 'Serializable', // Prevent concurrent version conflicts
    });

    return { success: true, newVersion: result.newVersion };
  } catch (error) {
    console.error("[resumeConversationForUpdate] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Complete an update session (mark done again and create snapshot).
 */
export async function completeUpdateSession(
  projectId: string,
  label?: string
): Promise<{ success: true; version: number } | { success: false; error: string }> {
  try {
    const conversation = await db.conversation.findUnique({
      where: { projectId },
      select: {
        id: true,
        isDone: true,
        currentVersion: true,
        messageCount: true,
        conversationMessages: {
          where: { isActive: true },
          select: { id: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      return { success: false, error: "Conversation not found" };
    }

    if (conversation.isDone) {
      return { success: false, error: "Conversation already done" };
    }

    const messageIds = conversation.conversationMessages.map(m => m.id);
    const version = conversation.currentVersion;

    // Create snapshot and mark as done
    await db.$transaction(async (tx) => {
      await tx.conversationSnapshot.create({
        data: {
          conversationId: conversation.id,
          version,
          messageCount: conversation.messageCount,
          snapshotReason: "project_update",
          label: label || null,
          messageIds,
        },
      });

      await tx.conversation.update({
        where: { id: conversation.id },
        data: {
          isDone: true,
          completionReason: "user_generated_requirements",
        },
      });
    });

    return { success: true, version };
  } catch (error) {
    console.error("[completeUpdateSession] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Rollback to a specific version.
 */
export async function rollbackToVersion(
  projectId: string,
  targetVersion: number
): Promise<{ success: true; restoredVersion: number } | { success: false; error: string }> {
  try {
    const conversation = await db.conversation.findUnique({
      where: { projectId },
      select: {
        id: true,
        currentVersion: true,
        snapshots: {
          where: { version: targetVersion },
          select: {
            id: true,
            version: true,
            messageIds: true,
          },
        },
      },
    });

    if (!conversation) {
      return { success: false, error: "Conversation not found" };
    }

    const snapshot = conversation.snapshots[0];
    if (!snapshot) {
      return { success: false, error: `Version ${targetVersion} not found` };
    }

    if (targetVersion >= conversation.currentVersion) {
      return { success: false, error: "Cannot rollback to current or future version" };
    }

    // Mark all messages after the snapshot as inactive
    const messageIdsInSnapshot = snapshot.messageIds;
    
    await db.$transaction(async (tx) => {
      // Deactivate all messages
      await tx.conversationMessage.updateMany({
        where: { 
          conversationId: conversation.id,
        },
        data: { isActive: false },
      });

      // Reactivate only messages from the snapshot
      await tx.conversationMessage.updateMany({
        where: {
          id: { in: messageIdsInSnapshot },
        },
        data: { isActive: true },
      });

      // Update conversation to point to this version
      await tx.conversation.update({
        where: { id: conversation.id },
        data: {
          activeVersionId: snapshot.id,
          isDone: true, // Rollback means we're viewing a completed state
          messageCount: messageIdsInSnapshot.length,
        },
      });
    });

    return { success: true, restoredVersion: targetVersion };
  } catch (error) {
    console.error("[rollbackToVersion] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Get all available versions for a conversation.
 */
export async function getConversationVersions(projectId: string) {
  const conversation = await db.conversation.findUnique({
    where: { projectId },
    select: {
      id: true,
      currentVersion: true,
      activeVersionId: true,
      snapshots: {
        select: {
          id: true,
          version: true,
          messageCount: true,
          snapshotReason: true,
          label: true,
          createdAt: true,
        },
        orderBy: { version: 'desc' },
      },
    },
  });

  if (!conversation) {
    return null;
  }

  return {
    currentVersion: conversation.currentVersion,
    activeVersionId: conversation.activeVersionId,
    versions: conversation.snapshots,
  };
}

/**
 * Get conversation status (for UI to know what buttons to show).
 */
export async function getConversationStatus(projectId: string): Promise<ConversationStatus | null> {
  const conversation = await db.conversation.findUnique({
    where: { projectId },
    select: {
      id: true,
      isDone: true,
      messageCount: true,
      currentVersion: true,
      activeVersionId: true,
      completionReason: true,
      snapshots: {
        select: {
          version: true,
          messageCount: true,
          label: true,
          snapshotReason: true,
          createdAt: true,
        },
        orderBy: { version: 'desc' },
      },
    },
  });

  if (!conversation) {
    return null;
  }

  const hasSnapshots = conversation.snapshots.length > 0;
  const isViewingSnapshot = conversation.activeVersionId !== null;

  return {
    exists: true,
    isDone: conversation.isDone,
    messageCount: conversation.messageCount,
    currentVersion: conversation.currentVersion,
    completionReason: conversation.completionReason as CompletionReason | null,
    activeVersionId: conversation.activeVersionId,
    hasSnapshots,
    isViewingSnapshot,
    snapshots: conversation.snapshots,
  };
}

/**
 * Increment message count when a new message is added.
 */
export async function incrementMessageCount(projectId: string): Promise<void> {
  await db.conversation.update({
    where: { projectId },
    data: {
      messageCount: { increment: 1 },
    },
  });
}
