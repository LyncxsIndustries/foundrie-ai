import { db } from "@/lib/db";

export class ProjectAuthError extends Error {
  readonly status: number;

  constructor(message = "Project not found.", status = 404) {
    super(message);
    this.name = "ProjectAuthError";
    this.status = status;
  }
}

/**
 * Validates that the user is the owner of the project.
 * Throws a ProjectAuthError (404) if the project does not exist or the user
 * does not have ownership access, preventing unauthorized existence leaks.
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
 * Validates that the user is a member (owner or collaborator) of the project.
 * Currently aliases requireProjectOwner since Collaborators are deferred to Feature 35.
 */
export async function requireProjectMember(projectId: string, userId: string) {
  return requireProjectOwner(projectId, userId);
}
