import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { requireProjectMember } from "@/lib/auth/project-access";
import { db } from "@/lib/db";
import {
  listAuthorizedRepos,
  getRepoMetadata,
  readRepoFile,
} from "@/lib/github/app-client";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const user = await requireAuth();

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { githubInstallationId: true },
  });

  if (!dbUser?.githubInstallationId) {
    return NextResponse.json(
      { error: "No GitHub installation found for user" },
      { status: 404 },
    );
  }

  try {
    const repos = await listAuthorizedRepos(dbUser.githubInstallationId);
    return NextResponse.json({ repos });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to list repos" },
      { status: 500 },
    );
  }
}

const ReadFileSchema = z.object({
  projectId: z.string(),
  owner: z.string(),
  repo: z.string(),
  path: z.string(),
  ref: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const user = await requireAuth();

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ReadFileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { projectId, owner, repo, path, ref } = parsed.data;

  // Enforce project membership
  await requireProjectMember(projectId, user.id);

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { githubInstallationId: true },
  });

  if (!dbUser?.githubInstallationId) {
    return NextResponse.json(
      { error: "No GitHub installation found for user" },
      { status: 404 },
    );
  }

  try {
    const { access } = await getRepoMetadata(
      dbUser.githubInstallationId,
      owner,
      repo,
    );

    if (access === "none") {
      return NextResponse.json({ error: "Repo not found or access denied" }, { status: 404 });
    }

    const fileData = await readRepoFile(
      dbUser.githubInstallationId,
      owner,
      repo,
      path,
      ref,
    );

    return NextResponse.json(fileData);
  } catch (error: any) {
    if (error.status === 404) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to read file" },
      { status: 500 },
    );
  }
}
