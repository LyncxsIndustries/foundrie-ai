import { db } from "../db";
import { ProjectStatus, DiagramStatus, ExecutionPlanStatus } from "../generated/prisma/enums";

export interface SessionCheckpoint {
  hasUnfinishedSession: boolean;
  resumeUrl: string | null;
  checkpointSummary: string | null;
  phase: string | null;
  lastActivityAt: Date | null;
}

export async function getSessionCheckpoint(projectId: string): Promise<SessionCheckpoint> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      conversation: true,
      diagrams: true,
      executionPlans: {
        where: {
          status: ExecutionPlanStatus.PROPOSED
        }
      }
    }
  });

  if (!project) {
    return {
      hasUnfinishedSession: false,
      resumeUrl: null,
      checkpointSummary: null,
      phase: null,
      lastActivityAt: null
    };
  }

  let hasUnfinishedSession = false;
  let resumeUrl: string | null = null;
  let checkpointSummary: string | null = null;

  // 1. Discovery Chat unfinished
  if (project.status === ProjectStatus.DISCOVERY && project.conversation) {
    const messages = Array.isArray(project.conversation.messages) ? project.conversation.messages : [];
    if (messages.length > 0) {
      hasUnfinishedSession = true;
      resumeUrl = `/projects/${projectId}/discovery`;
      checkpointSummary = `Unfinished discovery chat (${messages.length} messages)`;
    }
  }

  // 2. Architecture Proposal
  if (project.status === ProjectStatus.ARCHITECTURE) {
    if (project.executionPlans.length > 0) {
      hasUnfinishedSession = true;
      resumeUrl = `/projects/${projectId}/architecture`;
      checkpointSummary = "Unapproved architecture proposal";
    } else {
      // Check if diagrams are generating or queued (e.g. system context waiting for approval)
      const pendingDiagrams = project.diagrams.filter(d => 
        ([DiagramStatus.QUEUED, DiagramStatus.GENERATING, DiagramStatus.RENDERING, DiagramStatus.CAPTURING, DiagramStatus.ERROR] as DiagramStatus[]).includes(d.status as DiagramStatus)
      );
      if (pendingDiagrams.length > 0) {
        hasUnfinishedSession = true;
        resumeUrl = `/projects/${projectId}/diagrams`;
        checkpointSummary = `Diagram generation paused or in progress (${pendingDiagrams.length} pending)`;
      }
    }
  }

  // 3. Diagram Generation
  if (project.status === ProjectStatus.DIAGRAM_GENERATION) {
    const pendingDiagrams = project.diagrams.filter(d => 
      ([DiagramStatus.QUEUED, DiagramStatus.GENERATING, DiagramStatus.RENDERING, DiagramStatus.CAPTURING, DiagramStatus.ERROR] as DiagramStatus[]).includes(d.status as DiagramStatus)
    );
    if (pendingDiagrams.length > 0) {
      hasUnfinishedSession = true;
      resumeUrl = `/projects/${projectId}/diagrams`;
      checkpointSummary = `Diagram generation in progress (${pendingDiagrams.length} pending)`;
    }
  }

  return {
    hasUnfinishedSession,
    resumeUrl,
    checkpointSummary,
    phase: project.status,
    lastActivityAt: project.updatedAt
  };
}

export async function discardSession(projectId: string): Promise<void> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      executionPlans: {
        where: { status: ExecutionPlanStatus.PROPOSED }
      }
    }
  });

  if (!project) return;

  if (project.status === ProjectStatus.DISCOVERY) {
    await db.conversation.update({
      where: { projectId },
      data: { messages: [] }
    });
  }

  if (project.status === ProjectStatus.ARCHITECTURE) {
    if (project.executionPlans.length > 0) {
      await db.executionPlan.deleteMany({
        where: {
          projectId,
          status: ExecutionPlanStatus.PROPOSED
        }
      });
      // Rollback status to REQUIREMENTS so user can re-generate architecture
      await db.project.update({
        where: { id: projectId },
        data: { status: ProjectStatus.REQUIREMENTS }
      });
    } else {
      await db.diagram.deleteMany({
        where: {
          projectId,
          status: {
            in: [DiagramStatus.QUEUED, DiagramStatus.GENERATING, DiagramStatus.RENDERING, DiagramStatus.CAPTURING, DiagramStatus.ERROR]
          }
        }
      });
    }
  }

  if (project.status === ProjectStatus.DIAGRAM_GENERATION) {
    await db.diagram.deleteMany({
      where: {
        projectId,
        status: {
          in: [DiagramStatus.QUEUED, DiagramStatus.GENERATING, DiagramStatus.RENDERING, DiagramStatus.CAPTURING, DiagramStatus.ERROR]
        }
      }
    });
    // Rollback status to ARCHITECTURE if there are no DONE diagrams?
    const doneDiagrams = await db.diagram.count({
      where: { projectId, status: DiagramStatus.DONE }
    });
    if (doneDiagrams === 0) {
      await db.project.update({
        where: { id: projectId },
        data: { status: ProjectStatus.ARCHITECTURE }
      });
    }
  }
}
