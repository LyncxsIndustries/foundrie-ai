// Feature 64: Tests for conversation completion and versioning API routes
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import * as completionHelpers from "@/lib/conversations/completion";

// Mock dependencies
vi.mock("@/lib/auth/require-auth");
vi.mock("@/lib/auth/project-access");
vi.mock("@/lib/posthog-server");
vi.mock("@/lib/conversations/completion");

const mockRequireAuth = vi.mocked(await import("@/lib/auth/require-auth")).requireAuth;
const mockRequireProjectMember = vi.mocked(await import("@/lib/auth/project-access")).requireProjectMember;
const mockCaptureServerEvent = vi.mocked(await import("@/lib/posthog-server")).captureServerEvent;

describe("Conversation Completion API Routes", () => {
  const mockUser = { id: "user-123", plan: "PRO" };
  const mockProjectId = "project-456";

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue(mockUser as any);
    mockRequireProjectMember.mockResolvedValue(undefined);
    mockCaptureServerEvent.mockResolvedValue(undefined);
  });

  describe("POST /api/conversations/[projectId]/complete", () => {
    it("should mark conversation as done successfully", async () => {
      const markConversationDoneMock = vi.spyOn(completionHelpers, "markConversationDone");
      markConversationDoneMock.mockResolvedValue({ success: true, version: 1 });

      const { POST } = await import("@/app/api/conversations/[projectId]/complete/route");
      
      const request = new Request("http://localhost/api/conversations/project-456/complete", {
        method: "POST",
        body: JSON.stringify({ reason: "user_generated_requirements", label: "Initial completion" }),
      });

      const response = await POST(request, { 
        params: Promise.resolve({ projectId: mockProjectId }) 
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true, version: 1 });
      expect(markConversationDoneMock).toHaveBeenCalledWith(
        mockProjectId,
        "user_generated_requirements",
        "Initial completion"
      );
      expect(mockCaptureServerEvent).toHaveBeenCalledWith(
        mockUser.id,
        "conversation_marked_done",
        expect.objectContaining({
          project_id: mockProjectId,
          reason: "user_generated_requirements",
          version: 1,
        })
      );
    });

    it("should reject invalid completion reason", async () => {
      const { POST } = await import("@/app/api/conversations/[projectId]/complete/route");
      
      const request = new Request("http://localhost/api/conversations/project-456/complete", {
        method: "POST",
        body: JSON.stringify({ reason: "invalid_reason" }),
      });

      const response = await POST(request, { 
        params: Promise.resolve({ projectId: mockProjectId }) 
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Invalid completion reason");
    });

    it("should return error if conversation already done", async () => {
      const markConversationDoneMock = vi.spyOn(completionHelpers, "markConversationDone");
      markConversationDoneMock.mockResolvedValue({ 
        success: false, 
        error: "Conversation already marked as done" 
      });

      const { POST } = await import("@/app/api/conversations/[projectId]/complete/route");
      
      const request = new Request("http://localhost/api/conversations/project-456/complete", {
        method: "POST",
        body: JSON.stringify({ reason: "user_generated_requirements" }),
      });

      const response = await POST(request, { 
        params: Promise.resolve({ projectId: mockProjectId }) 
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("already marked as done");
    });
  });

  describe("POST /api/conversations/[projectId]/resume", () => {
    it("should resume conversation for updates successfully", async () => {
      const resumeMock = vi.spyOn(completionHelpers, "resumeConversationForUpdate");
      resumeMock.mockResolvedValue({ success: true, newVersion: 2 });

      const { POST } = await import("@/app/api/conversations/[projectId]/resume/route");
      
      const request = new Request("http://localhost/api/conversations/project-456/resume", {
        method: "POST",
      });

      const response = await POST(request, { 
        params: Promise.resolve({ projectId: mockProjectId }) 
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true, newVersion: 2 });
      expect(resumeMock).toHaveBeenCalledWith(mockProjectId);
      expect(mockCaptureServerEvent).toHaveBeenCalledWith(
        mockUser.id,
        "conversation_resumed_for_update",
        expect.objectContaining({
          project_id: mockProjectId,
          new_version: 2,
        })
      );
    });

    it("should return error if conversation not done", async () => {
      const resumeMock = vi.spyOn(completionHelpers, "resumeConversationForUpdate");
      resumeMock.mockResolvedValue({ 
        success: false, 
        error: "Conversation is not done, cannot resume for update" 
      });

      const { POST } = await import("@/app/api/conversations/[projectId]/resume/route");
      
      const request = new Request("http://localhost/api/conversations/project-456/resume", {
        method: "POST",
      });

      const response = await POST(request, { 
        params: Promise.resolve({ projectId: mockProjectId }) 
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("not done");
    });
  });

  describe("POST /api/conversations/[projectId]/rollback", () => {
    it("should rollback to specified version successfully", async () => {
      const rollbackMock = vi.spyOn(completionHelpers, "rollbackToVersion");
      rollbackMock.mockResolvedValue({ success: true, version: 1 });

      const { POST } = await import("@/app/api/conversations/[projectId]/rollback/route");
      
      const request = new Request("http://localhost/api/conversations/project-456/rollback", {
        method: "POST",
        body: JSON.stringify({ targetVersion: 1 }),
      });

      const response = await POST(request, { 
        params: Promise.resolve({ projectId: mockProjectId }) 
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true, version: 1 });
      expect(rollbackMock).toHaveBeenCalledWith(mockProjectId, 1);
      expect(mockCaptureServerEvent).toHaveBeenCalledWith(
        mockUser.id,
        "conversation_rolled_back",
        expect.objectContaining({
          project_id: mockProjectId,
          target_version: 1,
        })
      );
    });

    it("should reject invalid target version", async () => {
      const { POST } = await import("@/app/api/conversations/[projectId]/rollback/route");
      
      const request = new Request("http://localhost/api/conversations/project-456/rollback", {
        method: "POST",
        body: JSON.stringify({ targetVersion: -1 }),
      });

      const response = await POST(request, { 
        params: Promise.resolve({ projectId: mockProjectId }) 
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Invalid target version");
    });
  });

  describe("GET /api/conversations/[projectId]/versions", () => {
    it("should return conversation versions", async () => {
      const getVersionsMock = vi.spyOn(completionHelpers, "getConversationVersions");
      getVersionsMock.mockResolvedValue({
        currentVersion: 2,
        activeVersionId: null,
        versions: [
          {
            id: "snap-1",
            version: 1,
            messageCount: 10,
            snapshotReason: "initial_completion",
            label: "First completion",
            createdAt: new Date("2024-01-01"),
          },
          {
            id: "snap-2",
            version: 2,
            messageCount: 15,
            snapshotReason: "project_update",
            label: "After adding payments",
            createdAt: new Date("2024-01-02"),
          },
        ],
      });

      const { GET } = await import("@/app/api/conversations/[projectId]/versions/route");
      
      const request = new Request("http://localhost/api/conversations/project-456/versions");

      const response = await GET(request, { 
        params: Promise.resolve({ projectId: mockProjectId }) 
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.currentVersion).toBe(2);
      expect(data.versions).toHaveLength(2);
      expect(data.versions[0].version).toBe(1);
      expect(data.versions[1].version).toBe(2);
    });

    it("should return empty versions if conversation not found", async () => {
      const getVersionsMock = vi.spyOn(completionHelpers, "getConversationVersions");
      getVersionsMock.mockResolvedValue(null);

      const { GET } = await import("@/app/api/conversations/[projectId]/versions/route");
      
      const request = new Request("http://localhost/api/conversations/project-456/versions");

      const response = await GET(request, { 
        params: Promise.resolve({ projectId: mockProjectId }) 
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.currentVersion).toBe(1);
      expect(data.versions).toEqual([]);
    });
  });
});
