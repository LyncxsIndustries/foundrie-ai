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

    // Get conversation with messages (limited to last 200 for performance)
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
            createdAt: 'asc',
          },
          take: -200, // Negative take fetches last 200 messages
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ messages: [] });
    }

    return NextResponse.json({
      messages: conversation.conversationMessages.map((msg) => ({
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
      })),
    });
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
