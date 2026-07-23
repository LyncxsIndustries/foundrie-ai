import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/require-auth";
import { requireProjectMember, ProjectAuthError } from "@/lib/projects/auth";
import { getDiscoveryConversation, appendConversationMessage, ChatMessage } from "@/lib/conversations/chat";
import { db } from "@/lib/db";
import { AttachmentType } from "@/lib/generated/prisma/client";
import { auth, tasks } from "@trigger.dev/sdk";
import { captureServerEvent } from "@/lib/posthog-server";

interface IncomingAttachment {
  type: AttachmentType;
  cloudinaryId: string;
  cloudinaryUrl: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await requireAuth();
    const { projectId } = await params;
    await requireProjectMember(projectId, user.id);

    const { messages } = await getDiscoveryConversation(projectId);
    return NextResponse.json({ messages });
  } catch (error) {
    if (error instanceof AuthError) return new NextResponse(error.message, { status: error.status });
    if (error instanceof ProjectAuthError) return new NextResponse(error.message, { status: error.status });
    console.error("GET /api/conversations/[projectId]/chat error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await requireAuth();
    const { projectId } = await params;
    await requireProjectMember(projectId, user.id);

    const { message } = await request.json();
    if (!message || typeof message.content !== 'string') {
      return new NextResponse("Invalid message", { status: 400 });
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: message.content,
      createdAt: new Date().toISOString(),
    };

    // Append to legacy JSON storage
    const updatedMessages = await appendConversationMessage(projectId, userMessage);

    // Also persist to structured ConversationMessage table (Feature 54) - best effort
    let conversation: { id: string } | null = null;
    try {
      conversation = await db.conversation.findUnique({
        where: { projectId },
        select: { id: true },
      });

      if (conversation) {
        await db.conversationMessage.create({
          data: {
            conversationId: conversation.id,
            projectId,
            role: 'USER',
            content: message.content,
            attachments: message.attachments
              ? {
                  create: message.attachments.map((att: IncomingAttachment) => ({
                    type: att.type,
                    cloudinaryId: att.cloudinaryId,
                    cloudinaryUrl: att.cloudinaryUrl,
                    originalName: att.originalName,
                    mimeType: att.mimeType,
                    sizeBytes: att.sizeBytes,
                    width: att.width,
                    height: att.height,
                  })),
                }
              : undefined,
          },
        });
      }
    } catch (structuredError) {
      // Log but don't fail the request - legacy JSON storage is source of truth
      console.error('Failed to persist structured user message:', {
        projectId,
        conversationId: conversation?.id,
        error: structuredError instanceof Error ? structuredError.message : 'Unknown error',
        attachmentCount: message.attachments?.length || 0,
      });
    }

    // Format conversation history for the AI. Truncate to the last 6 messages to avoid context window limit exhaustion.
    const recentMessages = updatedMessages.slice(-6);
    
    // Add attachment context if present
    let attachmentContext = '';
    if (message.attachments && message.attachments.length > 0) {
      const descriptions = message.attachments.map((att: any) => {
        if (att.type === 'IMAGE') {
          return `[User uploaded image: ${att.originalName}]`;
        }
        return `[User attached ${att.type.toLowerCase()}: ${att.originalName}]`;
      });
      attachmentContext = '\n\n' + descriptions.join('\n');
    }
    
    const historyText = recentMessages.map(m => {
      const roleName = m.role === "user" ? "User" : "Assistant";
      return `${roleName}:\n${m.content}`;
    }).join("\n\n");

    // Trigger the background task for AI generation so the Next.js API route doesn't time out
    const handle = await tasks.trigger("streaming-chat-task", {
      projectId,
      userPlan: user.plan,
      historyText,
      attachmentContext,
      conversationId: conversation?.id,
      attachments: message.attachments,
    });

    // Create a temporary read-only token for the frontend to subscribe to the AI stream
    const publicToken = await auth.createPublicToken({
      scopes: {
        read: {
          runs: [handle.id],
        },
      },
      expirationTime: "1h",
    });

    await captureServerEvent(user.id, "discovery_message_sent", {
      project_id: projectId,
      attachment_count: message.attachments?.length ?? 0,
      has_content: message.content.trim().length > 0,
    });

    return NextResponse.json({
      runId: handle.id,
      token: publicToken,
    });
  } catch (error) {
    if (error instanceof AuthError) return new NextResponse(error.message, { status: error.status });
    if (error instanceof ProjectAuthError) return new NextResponse(error.message, { status: error.status });
    console.error("POST /api/conversations/[projectId]/chat error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
