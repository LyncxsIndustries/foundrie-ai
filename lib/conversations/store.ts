import { db } from "@/lib/db";
import { type Message, conversationSchema } from "./types";
import { ConversationPhase, MessageRole } from "../generated/prisma/client";

const MAX_MESSAGES = 200;
const MAX_CONTENT_LENGTH = 12000; // Limit single message size to prevent bloat

export async function getConversationMessages(projectId: string): Promise<Message[]> {
  let conversation = await db.conversation.findUnique({
    where: { projectId },
    select: { 
      conversationMessages: {
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          role: true,
          content: true,
          createdAt: true,
          metadata: true,
        }
      } 
    },
  });

  if (!conversation) {
    conversation = await db.conversation.create({
      data: {
        projectId,
        phase: ConversationPhase.DISCOVERY,
      },
      select: { 
        conversationMessages: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
            metadata: true,
          }
        } 
      },
    });
  }

  // Convert DB messages to Message format
  const messages: Message[] = conversation.conversationMessages.map(msg => ({
    id: msg.id,
    role: msg.role.toLowerCase() as 'user' | 'assistant',
    content: msg.content,
    createdAt: msg.createdAt.toISOString(),
  }));

  const result = conversationSchema.safeParse(messages);
  return result.success ? result.data : [];
}

export async function appendMessages(projectId: string, newMessages: Message[]): Promise<void> {
  // Get or create conversation
  let conversation = await db.conversation.findUnique({
    where: { projectId },
    select: { id: true },
  });

  if (!conversation) {
    conversation = await db.conversation.create({
      data: {
        projectId,
        phase: ConversationPhase.DISCOVERY,
      },
      select: { id: true },
    });
  }

  // Truncate overly long individual messages
  const sanitizedNew = newMessages.map(m => ({
    ...m,
    content: m.content.length > MAX_CONTENT_LENGTH 
      ? m.content.slice(0, MAX_CONTENT_LENGTH) + "\n\n[Message truncated due to length limits]" 
      : m.content
  }));

  // Create new messages in DB
  await db.conversationMessage.createMany({
    data: sanitizedNew.map(msg => ({
      conversationId: conversation.id,
      projectId,
      role: msg.role.toUpperCase() as MessageRole,
      content: msg.content,
      isActive: true,
    })),
  });

  // Cap total conversation length by marking old messages as inactive
  const totalCount = await db.conversationMessage.count({
    where: { conversationId: conversation.id, isActive: true },
  });

  if (totalCount > MAX_MESSAGES) {
    const toDeactivate = totalCount - MAX_MESSAGES;
    const oldMessages = await db.conversationMessage.findMany({
      where: { conversationId: conversation.id, isActive: true },
      orderBy: { createdAt: 'asc' },
      take: toDeactivate,
      select: { id: true },
    });

    await db.conversationMessage.updateMany({
      where: { id: { in: oldMessages.map(m => m.id) } },
      data: { isActive: false },
    });
  }
}
