import { db } from "@/lib/db";
import { type Message, conversationSchema } from "./types";
import { ConversationPhase } from "../generated/prisma/client";

const MAX_MESSAGES = 200;
const MAX_CONTENT_LENGTH = 12000; // Limit single message size to prevent bloat

export async function getConversationMessages(projectId: string): Promise<Message[]> {
  let conversation = await db.conversation.findUnique({
    where: { projectId },
    select: { messages: true },
  });

  if (!conversation) {
    conversation = await db.conversation.create({
      data: {
        projectId,
        phase: ConversationPhase.DISCOVERY,
        messages: JSON.stringify([]),
      },
      select: { messages: true },
    });
  }

  // Handle potential DB parsing
  let parsed: unknown = [];
  if (typeof conversation.messages === "string") {
    try {
      parsed = JSON.parse(conversation.messages);
    } catch {
      parsed = [];
    }
  } else {
    parsed = conversation.messages;
  }

  const result = conversationSchema.safeParse(parsed);
  return result.success ? result.data : [];
}

export async function appendMessages(projectId: string, newMessages: Message[]): Promise<void> {
  const current = await getConversationMessages(projectId);
  
  // Truncate overly long individual messages
  const sanitizedNew = newMessages.map(m => ({
    ...m,
    content: m.content.length > MAX_CONTENT_LENGTH 
      ? m.content.slice(0, MAX_CONTENT_LENGTH) + "\n\n[Message truncated due to length limits]" 
      : m.content
  }));

  const updated = [...current, ...sanitizedNew];
  
  // Cap total conversation length
  const bounded = updated.length > MAX_MESSAGES 
    ? updated.slice(updated.length - MAX_MESSAGES) 
    : updated;

  await db.conversation.upsert({
    where: { projectId },
    update: {
      messages: JSON.stringify(bounded),
    },
    create: {
      projectId,
      phase: ConversationPhase.DISCOVERY,
      messages: JSON.stringify(bounded),
    },
  });
}
