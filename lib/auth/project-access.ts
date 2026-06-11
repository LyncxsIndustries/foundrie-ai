import { db } from "@/lib/db";
import { ProjectMemberRole } from "@/lib/generated/prisma/client";

export class ProjectAuthError extends Error {
  readonly status: number;

  constructor(message = "Project not found.", status = 404) {
    super(message);
    this.name = "ProjectAuthError";
    this.status = status;
  }
}

export type ProjectAccessResult = {
  id: string;
  role: ProjectMemberRole;
};

/**
 * Validates that the user owns the project (Project.userId).
 * Throws ProjectAuthError (404) when the project is missing or not owned.
 */
export async function requireProjectOwner(projectId: string, userId: string) {
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });

  if (!project) {
    throw new ProjectAuthError();
  }

  return project;
}

/**
 * Validates owner or explicit ProjectMember access.
 * Returns the project id and the caller's role.
 */
export async function requireProjectMember(
  projectId: string,
  userId: string,
): Promise<ProjectAccessResult> {
  const access = await db.project.findFirst({
    where: {
      id: projectId,
      OR: [{ userId }, { members: { some: { userId } } }],
    },
    select: {
      id: true,
      userId: true,
      members: {
        where: { userId },
        select: { role: true },
        take: 1,
      },
    },
  });

  if (!access) {
    throw new ProjectAuthError();
  }

  const role =
    access.userId === userId
      ? ProjectMemberRole.OWNER
      : access.members[0]?.role;

  if (!role) {
    throw new ProjectAuthError();
  }

  return { id: access.id, role };
}

/**
 * Returns OWNER, COLLABORATOR, or null when the user has no project access.
 */
export async function getProjectRole(
  projectId: string,
  userId: string,
): Promise<ProjectMemberRole | null> {
  const project = await db.project.findFirst({
    where: { id: projectId },
    select: { userId: true },
  });

  if (!project) {
    return null;
  }

  if (project.userId === userId) {
    return ProjectMemberRole.OWNER;
  }

  const membership = await db.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId },
    },
    select: { role: true },
  });

  return membership?.role ?? null;
}
