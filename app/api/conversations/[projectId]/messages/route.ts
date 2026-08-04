// API endpoint for fetching conversation messages with attachments (Feature 54).

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth/get-auth-user';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;

    // Get conversation with messages
    const conversation = await db.conversation.findFirst({
      where: {
        projectId,
        project: {
          OR: [
            { userId: user.id },
            { members: { some: { userId: user.id } } },
          ],
        },
      },
      include: {
        conversationMessages: {
          where: { isActive: true },
          include: {
            attachments: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 200, 
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ messages: [] });
    }

    // Reverse to get chronological order
    const structuredMessages = conversation.conversationMessages.reverse().map((msg) => ({
      id: msg.id,
      role: msg.role.toLowerCase(),
      content: msg.content,
      createdAt: msg.createdAt,
      attachments: msg.attachments.map((att) => ({
        id: att.id,
        type: att.type.toLowerCase(),
        cloudinaryUrl: att.cloudinaryUrl,
        originalName: att.originalName,
        mimeType: att.mimeType,
        sizeBytes: att.sizeBytes,
        width: att.width,
        height: att.height,
      })),
    }));

    // Fallback to merge legacy JSON messages if they exist but aren't in structured storage
    const legacyMessages = (conversation.messages as any[]) || [];
    const mergedMessages = [...legacyMessages];

    // For every structured message, either replace the legacy one (if IDs match) or append it
    for (const sMsg of structuredMessages) {
      const idx = mergedMessages.findIndex(m => m.id === sMsg.id);
      if (idx >= 0) {
        mergedMessages[idx] = sMsg;
      } else {
        mergedMessages.push(sMsg);
      }
    }

    return NextResponse.json({
      messages: mergedMessages,
    });
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
