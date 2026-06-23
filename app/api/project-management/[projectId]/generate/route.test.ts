import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { requireAuth } from "@/lib/auth/require-auth";
import { generateProjectManagementDocs } from "@/lib/generation/project-management-docs";

vi.mock("@/lib/auth/require-auth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/generation/project-management-docs", () => ({
  generateProjectManagementDocs: vi.fn(),
}));

function makeRequest() {
  return new Request(
    "http://localhost/api/project-management/proj-1/generate",
    {
      method: "POST",
    }
  );
}

function makeParams(projectId = "proj-1") {
  return { params: Promise.resolve({ projectId }) };
}

describe("POST /api/project-management/[projectId]/generate", () => {
  const userId = "user-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"));

    const res = await POST(makeRequest(), makeParams());
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when project not found or not owner", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: userId } as any);
    vi.mocked(generateProjectManagementDocs).mockRejectedValue(
      new Error("Project not found.")
    );

    const res = await POST(makeRequest(), makeParams());
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.error).toBe("Not found");
  });

  it("returns 503 when AI providers are exhausted", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: userId } as any);
    vi.mocked(generateProjectManagementDocs).mockRejectedValue(
      new Error("AI rotation engine exhausted providers during generation.")
    );

    const res = await POST(makeRequest(), makeParams());
    expect(res.status).toBe(503);
  });

  it("returns 200 with generated documents on success", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: userId } as any);
    vi.mocked(generateProjectManagementDocs).mockResolvedValue({
      scopeMd: "# Scope",
      timelineMd: "# Timeline",
      pricingMd: "# Pricing",
      changelogMd: "# Change Log",
    });

    const res = await POST(makeRequest(), makeParams());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.scopeMd).toBe("# Scope");
    expect(body.timelineMd).toBe("# Timeline");
    expect(body.pricingMd).toBe("# Pricing");
    expect(body.changelogMd).toBe("# Change Log");
  });

  it("passes the correct projectId and userId to generateProjectManagementDocs", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: userId } as any);
    vi.mocked(generateProjectManagementDocs).mockResolvedValue({
      scopeMd: "",
      timelineMd: "",
      pricingMd: "",
      changelogMd: "",
    });

    await POST(makeRequest(), makeParams("proj-abc"));

    expect(generateProjectManagementDocs).toHaveBeenCalledWith(
      "proj-abc",
      userId
    );
  });
});
