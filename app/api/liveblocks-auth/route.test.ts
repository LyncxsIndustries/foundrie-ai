import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock dependencies before importing the route
vi.mock("@/lib/auth/require-auth");
vi.mock("@/lib/projects/auth");
vi.mock("@clerk/nextjs/server");
vi.mock("@liveblocks/node");

describe("POST /api/liveblocks-auth", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    const { requireAuth } = await import("@/lib/auth/require-auth");
    vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"));

    const { POST } = await import("./route");
    const request = new NextRequest("http://localhost:3000/api/liveblocks-auth", {
      method: "POST",
      body: JSON.stringify({ room: "project:test-id" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("returns 400 when room ID is invalid", async () => {
    const { requireAuth } = await import("@/lib/auth/require-auth");
    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1", email: "test@example.com" });

    const { POST } = await import("./route");
    const request = new NextRequest("http://localhost:3000/api/liveblocks-auth", {
      method: "POST",
      body: JSON.stringify({ room: "invalid-room" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 404 when user is not a project member", async () => {
    const { requireAuth } = await import("@/lib/auth/require-auth");
    const { requireProjectMember } = await import("@/lib/projects/auth");
    
    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1", email: "test@example.com" });
    vi.mocked(requireProjectMember).mockRejectedValue(new Error("Not found"));

    const { POST } = await import("./route");
    const request = new NextRequest("http://localhost:3000/api/liveblocks-auth", {
      method: "POST",
      body: JSON.stringify({ room: "project:test-id" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
  });
});
