import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { buildProjectZip } from "@/lib/zip/build-project-zip";
import { put } from "@vercel/blob";

vi.mock("@/lib/db", () => ({
  db: {
    project: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/zip/build-project-zip", () => ({
  buildProjectZip: vi.fn(),
}));

vi.mock("@vercel/blob", () => ({
  put: vi.fn(),
}));

vi.mock("@trigger.dev/sdk", () => ({
  task: vi.fn((config) => config),
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
  metadata: {
    set: vi.fn().mockReturnThis(),
    append: vi.fn().mockReturnThis(),
    del: vi.fn().mockReturnThis(),
  },
}));

global.fetch = vi.fn();

// Import after mocks
const { generateProjectZip } = await import("./generate-project-zip");

describe("generateProjectZip task", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when project not found", async () => {
    vi.mocked((db.project.findFirst as any) as any).mockResolvedValue(null);

    await expect(
      (generateProjectZip as any).run({ projectId: "proj_123", userId: "user_123" })
    ).rejects.toThrow("Project not found or access denied");
  });

  it("returns cached ZIP when within 10-minute window", async () => {
    const cachedAt = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    const cachedUrl = "https://blob.vercel-storage.com/cached.zip";

    vi.mocked((db.project.findFirst as any) as any).mockResolvedValue({
      id: "proj_123",
      slug: "test-project",
      lastZipUrl: cachedUrl,
      lastZipFileName: "test-project_2026-06-11_10-00-00.zip",
      lastZipGeneratedAt: cachedAt,
    });

    vi.mocked(fetch).mockResolvedValue({
      headers: new Map([["content-length", "1024"]]),
    } as any);

    const result = await (generateProjectZip as any).run({
      projectId: "proj_123",
      userId: "user_123",
    });

    expect(result.fileName).toBe("test-project_2026-06-11_10-00-00.zip");
    expect(result.url).toBe(cachedUrl);
    expect(result.size).toBe(1024);
    expect(buildProjectZip).not.toHaveBeenCalled();
  });

  it("builds new ZIP when cache expired", async () => {
    const expiredAt = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes ago
    const zipBuffer = Buffer.from("mock-zip-content");

    vi.mocked((db.project.findFirst as any) as any).mockResolvedValue({
      id: "proj_123",
      slug: "test-project",
      lastZipUrl: "https://blob.vercel-storage.com/old.zip",
      lastZipFileName: "old.zip",
      lastZipGeneratedAt: expiredAt,
    });

    vi.mocked(buildProjectZip).mockResolvedValue(zipBuffer);
    vi.mocked(put).mockResolvedValue({
      url: "https://blob.vercel-storage.com/new.zip",
    } as any);
    vi.mocked((db.project.update as any) as any).mockResolvedValue({} as any);

    const result = await (generateProjectZip as any).run({
      projectId: "proj_123",
      userId: "user_123",
    });

    expect(buildProjectZip).toHaveBeenCalledWith("proj_123", expect.objectContaining({ onProgress: expect.any(Function) }));
    expect(put).toHaveBeenCalled();
    expect((db.project.update as any)).toHaveBeenCalledWith({
      where: { id: "proj_123" },
      data: expect.objectContaining({
        lastZipUrl: "https://blob.vercel-storage.com/new.zip",
        lastZipGeneratedAt: expect.any(Date),
      }),
    });
    expect(result.url).toBe("https://blob.vercel-storage.com/new.zip");
  });

  it("builds new ZIP when no cache exists", async () => {
    const zipBuffer = Buffer.from("mock-zip-content");

    vi.mocked((db.project.findFirst as any) as any).mockResolvedValue({
      id: "proj_123",
      slug: "test-project",
      lastZipUrl: null,
      lastZipFileName: null,
      lastZipGeneratedAt: null,
    });

    vi.mocked(buildProjectZip).mockResolvedValue(zipBuffer);
    vi.mocked(put).mockResolvedValue({
      url: "https://blob.vercel-storage.com/new.zip",
    } as any);
    vi.mocked((db.project.update as any) as any).mockResolvedValue({} as any);

    const result = await (generateProjectZip as any).run({
      projectId: "proj_123",
      userId: "user_123",
    });

    expect(buildProjectZip).toHaveBeenCalledWith("proj_123", expect.objectContaining({ onProgress: expect.any(Function) }));
    expect(result.size).toBe(zipBuffer.length);
  });

  it("is idempotent - same projectId can be called multiple times", async () => {
    const zipBuffer = Buffer.from("mock-zip-content");

    vi.mocked((db.project.findFirst as any) as any).mockResolvedValue({
      id: "proj_123",
      slug: "test-project",
      lastZipUrl: null,
      lastZipFileName: null,
      lastZipGeneratedAt: null,
    });

    vi.mocked(buildProjectZip).mockResolvedValue(zipBuffer);
    vi.mocked(put).mockResolvedValue({
      url: "https://blob.vercel-storage.com/new.zip",
    } as any);
    vi.mocked((db.project.update as any) as any).mockResolvedValue({} as any);

    const payload = { projectId: "proj_123", userId: "user_123" };
    
    const result1 = await (generateProjectZip as any).run(payload);
    const result2 = await (generateProjectZip as any).run(payload);

    // Both calls succeed and return consistent results
    expect(result1.url).toBeDefined();
    expect(result2.url).toBeDefined();
    expect((db.project.update as any)).toHaveBeenCalled();
  });
});
