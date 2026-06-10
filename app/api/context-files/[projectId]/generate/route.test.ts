/**
 * Context File Generation Route Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/generated/prisma/enums", () => ({
  ContextFileType: {
    PROJECT_OVERVIEW: "PROJECT_OVERVIEW",
    ARCHITECTURE_CONTEXT: "ARCHITECTURE_CONTEXT",
    UI_CONTEXT: "UI_CONTEXT",
    CODE_STANDARDS: "CODE_STANDARDS",
    AI_WORKFLOW_RULES: "AI_WORKFLOW_RULES",
    PROGRESS_TRACKER: "PROGRESS_TRACKER",
  },
}));
vi.mock("@/lib/db", () => ({
  db: {
    contextFile: {
      upsert: vi.fn(),
    },
  },
}));
vi.mock("@/lib/auth/require-auth", () => ({
  requireAuth: vi.fn(),
}));
vi.mock("@/lib/projects/auth", () => ({
  requireProjectMember: vi.fn(),
}));
vi.mock("@/lib/generation/project-overview", () => ({
  generateProjectOverview: vi.fn(),
}));
vi.mock("@/lib/generation/architecture-context", () => ({
  generateArchitectureContext: vi.fn(),
}));
vi.mock("@/lib/generation/ui-context", () => ({
  generateUIContext: vi.fn(),
}));
vi.mock("@/lib/generation/code-standards", () => ({
  generateCodeStandards: vi.fn(),
}));

describe("POST /api/context-files/[projectId]/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    const { POST } = await import("./route");
    const { requireAuth } = await import("@/lib/auth/require-auth");
    vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"));

    const request = new Request("http://localhost/api/context-files/proj1/generate", {
      method: "POST",
      body: JSON.stringify({ fileType: "PROJECT_OVERVIEW" }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ projectId: "proj1" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 404 when user is not a project member", async () => {
    const { POST } = await import("./route");
    const { requireAuth } = await import("@/lib/auth/require-auth");
    const { requireProjectMember } = await import("@/lib/projects/auth");

    vi.mocked(requireAuth).mockResolvedValue({
      id: "user1",
      clerkId: "clerk1",
      email: "user@test.com",
      plan: "FREE",
      role: "USER",
    });
    vi.mocked(requireProjectMember).mockRejectedValue(
      new Error("Project not found.")
    );

    const request = new Request("http://localhost/api/context-files/proj1/generate", {
      method: "POST",
      body: JSON.stringify({ fileType: "PROJECT_OVERVIEW" }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ projectId: "proj1" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 400 when fileType is missing", async () => {
    const { POST } = await import("./route");
    const { requireAuth } = await import("@/lib/auth/require-auth");
    const { requireProjectMember } = await import("@/lib/projects/auth");

    vi.mocked(requireAuth).mockResolvedValue({
      id: "user1",
      clerkId: "clerk1",
      email: "user@test.com",
      plan: "FREE",
      role: "USER",
    });
    vi.mocked(requireProjectMember).mockResolvedValue({ id: "proj1" });

    const request = new Request("http://localhost/api/context-files/proj1/generate", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request, {
      params: Promise.resolve({ projectId: "proj1" }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("fileType is required");
  });

  it("returns 400 when fileType is invalid", async () => {
    const { POST } = await import("./route");
    const { requireAuth } = await import("@/lib/auth/require-auth");
    const { requireProjectMember } = await import("@/lib/projects/auth");

    vi.mocked(requireAuth).mockResolvedValue({
      id: "user1",
      clerkId: "clerk1",
      email: "user@test.com",
      plan: "FREE",
      role: "USER",
    });
    vi.mocked(requireProjectMember).mockResolvedValue({ id: "proj1" });

    const request = new Request("http://localhost/api/context-files/proj1/generate", {
      method: "POST",
      body: JSON.stringify({ fileType: "INVALID_TYPE" }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ projectId: "proj1" }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Invalid fileType");
  });

  it("generates and upserts PROJECT_OVERVIEW successfully", async () => {
    const { POST } = await import("./route");
    const { requireAuth } = await import("@/lib/auth/require-auth");
    const { requireProjectMember } = await import("@/lib/projects/auth");
    const { generateProjectOverview } = await import("@/lib/generation/project-overview");
    const { db } = await import("@/lib/db");

    vi.mocked(requireAuth).mockResolvedValue({
      id: "user1",
      clerkId: "clerk1",
      email: "user@test.com",
      plan: "FREE",
      role: "USER",
    });
    vi.mocked(requireProjectMember).mockResolvedValue({ id: "proj1" });
    vi.mocked(generateProjectOverview).mockResolvedValue("# Test Project\n\nOverview content");

    const mockContextFile = {
      id: "ctx1",
      projectId: "proj1",
      fileType: "PROJECT_OVERVIEW" as const,
      content: "# Test Project\n\nOverview content",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.contextFile.upsert).mockResolvedValue(mockContextFile);

    const request = new Request("http://localhost/api/context-files/proj1/generate", {
      method: "POST",
      body: JSON.stringify({ fileType: "PROJECT_OVERVIEW" }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ projectId: "proj1" }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBe("ctx1");
    expect(data.fileType).toBe("PROJECT_OVERVIEW");
    expect(data.content).toContain("# Test Project");
    expect(vi.mocked(generateProjectOverview)).toHaveBeenCalledWith("proj1");
    expect(vi.mocked(db.contextFile.upsert)).toHaveBeenCalledWith({
      where: {
        projectId_fileType: {
          projectId: "proj1",
          fileType: "PROJECT_OVERVIEW",
        },
      },
      create: {
        projectId: "proj1",
        fileType: "PROJECT_OVERVIEW",
        content: "# Test Project\n\nOverview content",
      },
      update: {
        content: "# Test Project\n\nOverview content",
      },
    });
  });

  it("generates and upserts ARCHITECTURE_CONTEXT successfully", async () => {
    const { POST } = await import("./route");
    const { requireAuth } = await import("@/lib/auth/require-auth");
    const { requireProjectMember } = await import("@/lib/projects/auth");
    const { generateArchitectureContext } = await import("@/lib/generation/architecture-context");
    const { db } = await import("@/lib/db");

    vi.mocked(requireAuth).mockResolvedValue({
      id: "user1",
      clerkId: "clerk1",
      email: "user@test.com",
      plan: "FREE",
      role: "USER",
    });
    vi.mocked(requireProjectMember).mockResolvedValue({ id: "proj1" });
    vi.mocked(generateArchitectureContext).mockResolvedValue("# Architecture Context\n\nStack details");

    const mockContextFile = {
      id: "ctx2",
      projectId: "proj1",
      fileType: "ARCHITECTURE_CONTEXT" as const,
      content: "# Architecture Context\n\nStack details",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.contextFile.upsert).mockResolvedValue(mockContextFile);

    const request = new Request("http://localhost/api/context-files/proj1/generate", {
      method: "POST",
      body: JSON.stringify({ fileType: "ARCHITECTURE_CONTEXT" }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ projectId: "proj1" }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBe("ctx2");
    expect(data.fileType).toBe("ARCHITECTURE_CONTEXT");
    expect(data.content).toContain("Architecture Context");
    expect(vi.mocked(generateArchitectureContext)).toHaveBeenCalledWith("proj1");
  });

  it("generates and upserts UI_CONTEXT successfully", async () => {
    const { POST } = await import("./route");
    const { requireAuth } = await import("@/lib/auth/require-auth");
    const { requireProjectMember } = await import("@/lib/projects/auth");
    const { generateUIContext } = await import("@/lib/generation/ui-context");
    const { db } = await import("@/lib/db");

    vi.mocked(requireAuth).mockResolvedValue({
      id: "user1",
      clerkId: "clerk1",
      email: "user@test.com",
      plan: "FREE",
      role: "USER",
    });
    vi.mocked(requireProjectMember).mockResolvedValue({ id: "proj1" });
    vi.mocked(generateUIContext).mockResolvedValue("# UI Context\n\nDesign tokens and patterns");

    const mockContextFile = {
      id: "ctx3",
      projectId: "proj1",
      fileType: "UI_CONTEXT" as const,
      content: "# UI Context\n\nDesign tokens and patterns",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.contextFile.upsert).mockResolvedValue(mockContextFile);

    const request = new Request("http://localhost/api/context-files/proj1/generate", {
      method: "POST",
      body: JSON.stringify({ fileType: "UI_CONTEXT" }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ projectId: "proj1" }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBe("ctx3");
    expect(data.fileType).toBe("UI_CONTEXT");
    expect(data.content).toContain("UI Context");
    expect(vi.mocked(generateUIContext)).toHaveBeenCalledWith("proj1");
  });

  it("generates and upserts CODE_STANDARDS successfully", async () => {
    const { POST } = await import("./route");
    const { requireAuth } = await import("@/lib/auth/require-auth");
    const { requireProjectMember } = await import("@/lib/projects/auth");
    const { generateCodeStandards } = await import("@/lib/generation/code-standards");
    const { db } = await import("@/lib/db");

    vi.mocked(requireAuth).mockResolvedValue({
      id: "user1",
      clerkId: "clerk1",
      email: "user@test.com",
      plan: "FREE",
      role: "USER",
    });
    vi.mocked(requireProjectMember).mockResolvedValue({ id: "proj1" });
    vi.mocked(generateCodeStandards).mockResolvedValue("# Code Standards\n\nExtends ARTKINS_STYLE_GUIDE.md");

    const mockContextFile = {
      id: "ctx4",
      projectId: "proj1",
      fileType: "CODE_STANDARDS" as const,
      content: "# Code Standards\n\nExtends ARTKINS_STYLE_GUIDE.md",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.contextFile.upsert).mockResolvedValue(mockContextFile);

    const request = new Request("http://localhost/api/context-files/proj1/generate", {
      method: "POST",
      body: JSON.stringify({ fileType: "CODE_STANDARDS" }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ projectId: "proj1" }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBe("ctx4");
    expect(data.fileType).toBe("CODE_STANDARDS");
    expect(data.content).toContain("Code Standards");
    expect(vi.mocked(generateCodeStandards)).toHaveBeenCalledWith("proj1");
  });
});
