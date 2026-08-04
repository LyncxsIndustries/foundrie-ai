import { db } from "../db";
import { ConversationPhase } from "../generated/prisma/client";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export async function getDiscoveryConversation(projectId: string) {
  let conversation = await db.conversation.findUnique({
    where: { projectId },
  });

  if (!conversation) {
    conversation = await db.conversation.create({
      data: {
        projectId,
        phase: ConversationPhase.DISCOVERY,
      },
    });
  }

  return { conversation };
}
