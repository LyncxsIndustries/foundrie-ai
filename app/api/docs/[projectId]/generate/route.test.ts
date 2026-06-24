import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { requireAuth } from "@/lib/auth/require-auth";
import { generateProjectDocs } from "@/lib/generation/project-docs";

vi.mock("@/lib/auth/require-auth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/generation/project-docs", () => ({
  generateProjectDocs: vi.fn(),
}));

describe("POST /api/docs/[projectId]/generate", () => {
  const projectId = "proj-1";
  const userId = "user-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if unauthenticated", async () => {
    vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"));

    const req = new Request(`http://localhost/api/docs/${projectId}/generate`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ projectId }) });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 404 if project not found or not owner", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: userId } as any);
    vi.mocked(generateProjectDocs).mockRejectedValue(
      new Error(`Project ${projectId} not found.`)
    );

    const req = new Request(`http://localhost/api/docs/${projectId}/generate`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ projectId }) });

    expect(res.status).toBe(404);
  });

  it("should return 503 if AI providers are exhausted", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: userId } as any);
    vi.mocked(generateProjectDocs).mockRejectedValue(
      new Error("AI rotation engine exhausted providers during generation.")
    );

    const req = new Request(`http://localhost/api/docs/${projectId}/generate`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ projectId }) });

    expect(res.status).toBe(503);
  });

  it("should return 200 on success", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: userId } as any);
    vi.mocked(generateProjectDocs).mockResolvedValue({
      success: true,
      documentCount: 8,
    } as any);

    const req = new Request(`http://localhost/api/docs/${projectId}/generate`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ projectId }) });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.documentCount).toBe(8);
  });
});
