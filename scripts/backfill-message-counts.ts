#!/usr/bin/env tsx
/**
 * Feature 64: Backfill messageCount for existing conversations
 * 
 * This script is idempotent - it can be run multiple times safely.
 * It initializes Conversation.messageCount from existing ConversationMessage records
 * for conversations where messageCount is 0 but messages exist.
 * 
 * Usage: npx tsx scripts/backfill-message-counts.ts
 */

import { db } from "../lib/db";

async function backfillMessageCounts() {
  console.log("🔄 Starting message count backfill...\n");

  try {
    // Find all conversations with messageCount = 0
    const conversations = await db.conversation.findMany({
      where: {
        messageCount: 0,
      },
      select: {
        id: true,
        projectId: true,
        conversationMessages: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    });

    console.log(`Found ${conversations.length} conversations with messageCount = 0\n`);

    if (conversations.length === 0) {
      console.log("✅ No conversations need backfilling. All counts are accurate.\n");
      return;
    }

    let updated = 0;
    let skipped = 0;

    for (const conversation of conversations) {
      const actualCount = conversation.conversationMessages.length;

      if (actualCount === 0) {
        // This is correct - conversation truly has no messages
        skipped++;
        continue;
      }

      // Update the count
      await db.conversation.update({
        where: { id: conversation.id },
        data: { messageCount: actualCount },
      });

      console.log(
        `✓ Updated conversation ${conversation.projectId}: ${actualCount} messages`
      );
      updated++;
    }

    console.log(`\n✅ Backfill complete!`);
    console.log(`   Updated: ${updated} conversations`);
    console.log(`   Skipped: ${skipped} conversations (already accurate)\n`);
  } catch (error) {
    console.error("❌ Backfill failed:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  backfillMessageCounts();
}

export { backfillMessageCounts };
