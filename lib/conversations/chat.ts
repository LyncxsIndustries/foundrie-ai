import { db } from "../db";
import { ConversationPhase } from "../generated/prisma/client";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

const MAX_MESSAGES = 100;

export async function getDiscoveryConversation(projectId: string) {
  let conversation = await db.conversation.findUnique({
    where: { projectId },
  });

  if (!conversation) {
    conversation = await db.conversation.create({
      data: {
        projectId,
        phase: ConversationPhase.DISCOVERY,
        messages: [],
      },
    });
  }

  // Cast JSON to our known type
  const messages = (conversation.messages as unknown as ChatMessage[]) ?? [];
  return { conversation, messages };
}

export async function appendConversationMessage(
  projectId: string,
  message: ChatMessage,
) {
  const { messages } = await getDiscoveryConversation(projectId);
  
  const newMessages = [...messages, message];
  
  // Truncate to bound JSON growth (Feature 10 limit)
  if (newMessages.length > MAX_MESSAGES) {
    newMessages.splice(0, newMessages.length - MAX_MESSAGES);
  }

  await db.conversation.update({
    where: { projectId },
    data: { messages: newMessages as any },
  });

  return newMessages;
}
