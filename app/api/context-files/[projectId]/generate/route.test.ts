/**
 * AGENTS.md Generation API Route Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { db } from "@/lib/db";

vi.mock("@/lib/db");
vi.mock("@/lib/auth/require-auth");
vi.mock("@/lib/projects/auth");
vi.mock("@/lib/generation/agents-md");

describe("POST /api/context-files/[projectId]/generate - AI_WORKFLOW_RULES", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { requireAuth } = await import("@/lib/auth/require-auth");
    vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"));

    const request = new Request("http://localhost:3000/api/context-files/test-project/generate", {
      method: "POST",
      body: JSON.stringify({ fileType: "AI_WORKFLOW_RULES" }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ projectId: "test-project" }),
    });

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when user is not project member", async () => {
    const { requireAuth } = await import("@/lib/auth/require-auth");
    const { requireProjectMember } = await import("@/lib/projects/auth");

    vi.mocked(requireAuth).mockResolvedValue({
      id: "user-123",
      clerkId: "clerk-123",
      email: "test@example.com",
      plan: "FREE",
      role: "USER",
    });

    vi.mocked(requireProjectMember).mockRejectedValue(
      new Error("Project not found")
    );

    const request = new Request("http://localhost:3000/api/context-files/test-project/generate", {
      method: "POST",
      body: JSON.stringify({ fileType: "AI_WORKFLOW_RULES" }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ projectId: "test-project" }),
    });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Not found");
  });

  it("generates AGENTS.md and returns 200", async () => {
    const { requireAuth } = await import("@/lib/auth/require-auth");
    const { requireProjectMember } = await import("@/lib/projects/auth");
    const { generateAgentsMD } = await import("@/lib/generation/agents-md");

    vi.mocked(requireAuth).mockResolvedValue({
      id: "user-123",
      clerkId: "clerk-123",
      email: "test@example.com",
      plan: "FREE",
      role: "USER",
    });

    vi.mocked(requireProjectMember).mockResolvedValue(undefined);

    vi.mocked(generateAgentsMD).mockResolvedValue(`# AGENTS.md

## PROJECT IDENTITY
Test project description.

## MANDATORY READING ORDER
1. ARTKINS_STYLE_GUIDE.md

## INIT PLAN DATA
Tell me 'ready' when you have completed the above, and I will begin Feature 01.

## HARD RULES
Planning gate required.

## FEATURE ORDER
1. Feature One

## STACK REFERENCE
Next.js stack

## RESEARCH FILES
None`);

    const mockContextFile = {
      id: "cf-123",
      projectId: "test-project",
      fileType: "AI_WORKFLOW_RULES",
      content: "# AGENTS.md\n\nTest content",
      createdAt: new Date("2026-06-11T10:00:00Z"),
      updatedAt: new Date("2026-06-11T10:00:00Z"),
    };

    vi.mocked(db, { partial: true, deep: true }).contextFile = {
      upsert: vi.fn().mockResolvedValue(mockContextFile),
    } as any;

    const request = new Request("http://localhost:3000/api/context-files/test-project/generate", {
      method: "POST",
      body: JSON.stringify({ fileType: "AI_WORKFLOW_RULES" }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ projectId: "test-project" }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.id).toBe("cf-123");
    expect(body.fileType).toBe("AI_WORKFLOW_RULES");
    expect(body.content).toContain("AGENTS.md");
    expect(generateAgentsMD).toHaveBeenCalledWith("test-project");
  });
});
