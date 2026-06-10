import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockAllow, mockAuthorize, mockPrepareSession } = vi.hoisted(() => {
  const allow = vi.fn();
  const authorize = vi.fn();

  return {
    mockAllow: allow,
    mockAuthorize: authorize,
    mockPrepareSession: vi.fn(() => ({
      FULL_ACCESS: "full-access",
      allow,
      authorize,
    })),
  };
});

vi.mock("@/lib/auth/require-auth", () => ({
  requireAuth: vi.fn(),
}));
vi.mock("@/lib/projects/auth", () => ({
  requireProjectMember: vi.fn(),
}));
vi.mock("@clerk/nextjs/server", () => ({
  currentUser: vi.fn(),
}));
vi.mock("@liveblocks/node", () => ({
  Liveblocks: vi.fn(function Liveblocks() {
    return {
      prepareSession: mockPrepareSession,
    };
  }),
}));

describe("POST /api/liveblocks-auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthorize.mockResolvedValue({ status: 200, body: "token" });
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
    vi.mocked(requireAuth).mockResolvedValue({
      id: "user-1",
      clerkId: "clerk-1",
      email: "test@example.com",
      plan: "FREE",
      role: "USER",
    });

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
    
    vi.mocked(requireAuth).mockResolvedValue({
      id: "user-1",
      clerkId: "clerk-1",
      email: "test@example.com",
      plan: "FREE",
      role: "USER",
    });
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
