/**
 * Progress Tracker Generation API Route Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { db } from "@/lib/db";
import * as requireAuthModule from "@/lib/auth/require-auth";
import * as projectAuthModule from "@/lib/projects/auth";
import * as progressTrackerModule from "@/lib/generation/progress-tracker";

vi.mock("@/lib/db");
vi.mock("@/lib/auth/require-auth");
vi.mock("@/lib/projects/auth");
vi.mock("@/lib/generation/progress-tracker");

describe("POST /api/context-files/[projectId]/generate - PROGRESS_TRACKER", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.spyOn(requireAuthModule, "requireAuth").mockRejectedValue(
      new Error("Unauthorized")
    );

    const request = new Request("http://localhost/api/context-files/proj-1/generate", {
      method: "POST",
      body: JSON.stringify({ fileType: "PROGRESS_TRACKER" }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ projectId: "proj-1" }),
    });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 404 when project not found", async () => {
    vi.spyOn(requireAuthModule, "requireAuth").mockResolvedValue({
      id: "user-1",
      clerkId: "clerk-1",
      email: "test@example.com",
      plan: "FREE",
      role: "USER",
    });

    vi.spyOn(projectAuthModule, "requireProjectMember").mockRejectedValue(
      new Error("Project not found")
    );

    const request = new Request("http://localhost/api/context-files/proj-1/generate", {
      method: "POST",
      body: JSON.stringify({ fileType: "PROGRESS_TRACKER" }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ projectId: "proj-1" }),
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Not found");
  });

  it("generates and persists progress tracker successfully", async () => {
    vi.spyOn(requireAuthModule, "requireAuth").mockResolvedValue({
      id: "user-1",
      clerkId: "clerk-1",
      email: "test@example.com",
      plan: "FREE",
      role: "USER",
    });

    vi.spyOn(projectAuthModule, "requireProjectMember").mockResolvedValue(undefined);

    const mockContent = `# Progress Tracker

## Current Phase

- Ready for Implementation

## Current Goal

- **Feature 01 - Auth Setup**: Begin implementation

## Last Updated

2026-06-11T12:00:00.000Z`;

    vi.spyOn(progressTrackerModule, "generateProgressTracker").mockResolvedValue(mockContent);

    const mockContextFile = {
      id: "ctx-1",
      projectId: "proj-1",
      fileType: "PROGRESS_TRACKER",
      content: mockContent,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db, { partial: true, deep: true }).contextFile = {
      upsert: vi.fn().mockResolvedValue(mockContextFile),
    } as any;

    const request = new Request("http://localhost/api/context-files/proj-1/generate", {
      method: "POST",
      body: JSON.stringify({ fileType: "PROGRESS_TRACKER" }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ projectId: "proj-1" }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.fileType).toBe("PROGRESS_TRACKER");
    expect(data.content).toContain("Progress Tracker");
    expect(data.content).toContain("Current Phase");
    expect(progressTrackerModule.generateProgressTracker).toHaveBeenCalledWith("proj-1");
  });
});
