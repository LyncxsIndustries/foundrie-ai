import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { requireProjectMember } from '@/lib/auth/require-project-member';
import { prisma } from '@/lib/db';

/**
 * GET /api/tasks/history/[taskId]
 * 
 * Fetch progress history for a specific task
 * Returns TaskProgressLog entries in reverse chronological order
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const userId = await requireAuth();
    const { taskId } = params;

    // Get projectId from query params
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId query parameter is required' },
        { status: 400 }
      );
    }

    // Verify user is a project member
    await requireProjectMember(projectId, userId);

    // Fetch progress logs for this task
    const progressLogs = await prisma.taskProgressLog.findMany({
      where: {
        taskId,
        projectId,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    return NextResponse.json({
      taskId,
      logs: progressLogs,
      total: progressLogs.length,
    });
  } catch (error: any) {
    console.error('Error fetching task progress history:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch progress history' },
      { status: 500 }
    );
  }
}
