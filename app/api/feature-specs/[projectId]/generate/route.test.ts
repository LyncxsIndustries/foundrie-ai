/**
 * Feature 26 - Feature Specs Generation
 * Tests for POST /api/feature-specs/[projectId]/generate
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { db } from "@/lib/db";
import * as requireAuthModule from "@/lib/auth/require-auth";
import * as projectAuthModule from "@/lib/projects/auth";
import * as generationModule from "@/lib/generation/feature-specs";

vi.mock("@/lib/db");
vi.mock("@/lib/auth/require-auth");
vi.mock("@/lib/projects/auth");
vi.mock("@/lib/generation/feature-specs");

describe("POST /api/feature-specs/[projectId]/generate", () => {
  const mockRequest = {} as any;
  const mockParams = Promise.resolve({ projectId: "project-123" });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAuthModule.requireAuth).mockRejectedValueOnce(
      new requireAuthModule.AuthError("Unauthenticated"),
    );

    const response = await POST(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Unauthenticated");
  });

  it("returns 404 when user is not project member", async () => {
    vi.mocked(requireAuthModule.requireAuth).mockResolvedValueOnce({
      id: "user-1",
      clerkId: "clerk-1",
      email: "test@example.com",
      plan: "FREE",
      role: "USER",
    });
    vi.mocked(projectAuthModule.requireProjectMember).mockRejectedValueOnce(
      new projectAuthModule.ProjectAuthError("Not a member"),
    );

    const response = await POST(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Not found");
  });

  it("returns 200 with specs array on success", async () => {
    const mockSpecs = [
      { id: "spec-1", order: 1, title: "Feature 1", content: "# Feature 1" },
      { id: "spec-2", order: 2, title: "Feature 2", content: "# Feature 2" },
    ];

    vi.mocked(requireAuthModule.requireAuth).mockResolvedValueOnce({
      id: "user-1",
      clerkId: "clerk-1",
      email: "test@example.com",
      plan: "FREE",
      role: "USER",
    });
    vi.mocked(projectAuthModule.requireProjectMember).mockResolvedValueOnce(
      undefined,
    );
    vi.mocked(generationModule.generateFeatureSpecs).mockResolvedValueOnce(
      mockSpecs as any,
    );

    const response = await POST(mockRequest, { params: mockParams });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.specs).toEqual(mockSpecs);
    expect(generationModule.generateFeatureSpecs).toHaveBeenCalledWith(
      "project-123",
    );
  });
});
