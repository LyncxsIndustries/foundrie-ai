import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/research/[projectId]/files/bulk/route";
import { NextRequest } from "next/server";

// Mock dependencies
vi.mock("@/lib/auth/get-auth-user", () => ({
  getAuthUser: vi.fn(),
}));

vi.mock("@/lib/auth/project-access", () => ({
  requireProjectMember: vi.fn(),
}));

vi.mock("@/lib/media/bulk-operations", () => ({
  executeBulkOperation: vi.fn(),
}));

import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireProjectMember } from "@/lib/auth/project-access";
import { executeBulkOperation } from "@/lib/media/bulk-operations";

describe("Bulk Operations API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/research/proj1/files/bulk", {
      method: "POST",
      body: JSON.stringify({ operation: "delete", fileIds: ["file1"] }),
    });

    const response = await POST(req, {
      params: Promise.resolve({ projectId: "proj1" }),
    });

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 404 when user is not project member", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: "user1", plan: "FREE" });
    vi.mocked(requireProjectMember).mockRejectedValue(new Error("Not authorized"));

    const req = new NextRequest("http://localhost/api/research/proj1/files/bulk", {
      method: "POST",
      body: JSON.stringify({ operation: "delete", fileIds: ["file1"] }),
    });

    const response = await POST(req, {
      params: Promise.resolve({ projectId: "proj1" }),
    });

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toBe("Project not found");
  });

  it("returns 400 for invalid request body", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: "user1", plan: "FREE" });
    vi.mocked(requireProjectMember).mockResolvedValue(undefined);

    const req = new NextRequest("http://localhost/api/research/proj1/files/bulk", {
      method: "POST",
      body: JSON.stringify({ operation: "invalid-op" }),
    });

    const response = await POST(req, {
      params: Promise.resolve({ projectId: "proj1" }),
    });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("Invalid request");
  });

  it("executes bulk operation successfully", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: "user1", plan: "FREE" });
    vi.mocked(requireProjectMember).mockResolvedValue(undefined);
    vi.mocked(executeBulkOperation).mockResolvedValue({
      success: true,
      updatedCount: 3,
    });

    const req = new NextRequest("http://localhost/api/research/proj1/files/bulk", {
      method: "POST",
      body: JSON.stringify({
        operation: "update-category",
        fileIds: ["file1", "file2", "file3"],
        data: { category: "WIREFRAMES" },
      }),
    });

    const response = await POST(req, {
      params: Promise.resolve({ projectId: "proj1" }),
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.updatedCount).toBe(3);
  });
});
