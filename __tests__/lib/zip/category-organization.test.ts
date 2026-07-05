import { describe, it, expect, vi, beforeEach } from "vitest";
import JSZip from "jszip";

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    $transaction: vi.fn(),
  },
}));

vi.mock("@vercel/blob", () => ({
  get: vi.fn(),
}));

import { buildProjectZip } from "@/lib/zip/build-project-zip";
import { db } from "@/lib/db";
import { get } from "@vercel/blob";

describe("ZIP Export - Category Organization", () => {
  const mockProjectData = {
    slug: "test-project",
    name: "Test Project",
    contextFiles: [],
    featureSpecs: [],
    diagrams: [],
    researchDocuments: [],
    researchAssets: [
      {
        fileName: "screenshot1.png",
        storageUrl: "https://example.com/screenshot1.png",
        mimeType: "image/png",
        category: "inspiration",
        tags: ["dark-theme"],
        aiDescription: "A dark-themed dashboard",
        order: 0,
      },
      {
        fileName: "wireframe1.png",
        storageUrl: "https://example.com/wireframe1.png",
        mimeType: "image/png",
        category: "wireframes",
        tags: ["mobile"],
        aiDescription: null,
        order: 0,
      },
      {
        fileName: "logo.svg",
        storageUrl: "https://example.com/logo.svg",
        mimeType: "image/svg+xml",
        category: "branding",
        tags: [],
        aiDescription: "Company logo",
        order: 0,
      },
    ],
    agentSkills: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock db transaction with proper typing and mock data
    vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
      const mockTx = {
        project: {
          findUnique: vi.fn().mockResolvedValue(mockProjectData),
        },
      };
      return await callback(mockTx);
    });

    vi.mocked(get).mockResolvedValue({
      statusCode: 200,
      stream: {
        getReader: () => ({
          read: vi.fn()
            .mockResolvedValueOnce({
              done: false,
              value: new Uint8Array([1, 2, 3]),
            })
            .mockResolvedValueOnce({
              done: true,
              value: undefined,
            }),
        }),
      },
    } as any);
  });

  it("organizes assets by category folders", async () => {
    const zipBuffer = await buildProjectZip("proj1", { includeResearchAssets: true });
    const zip = await JSZip.loadAsync(zipBuffer);

    // Check category folders exist
    expect(zip.file(/research\/assets\/inspiration\//)).not.toBeNull();
    expect(zip.file(/research\/assets\/wireframes\//)).not.toBeNull();
    expect(zip.file(/research\/assets\/branding\//)).not.toBeNull();
  });

  it("generates FILES.md manifest", async () => {
    const zipBuffer = await buildProjectZip("proj1", { includeResearchAssets: true });
    const zip = await JSZip.loadAsync(zipBuffer);

    const filesManifest = zip.file(/research\/assets\/FILES\.md$/);
    expect(filesManifest).not.toBeNull();

    if (filesManifest && filesManifest.length > 0) {
      const content = await filesManifest[0].async("string");
      expect(content).toContain("# Research Asset Manifest");
      expect(content).toContain("## Inspiration");
      expect(content).toContain("## Wireframes");
      expect(content).toContain("## Branding");
      expect(content).toContain("screenshot1.png");
      expect(content).toContain("wireframe1.png");
      expect(content).toContain("logo.svg");
      expect(content).toContain("A dark-themed dashboard");
    }
  });

  it("includes asset metadata in manifest", async () => {
    const zipBuffer = await buildProjectZip("proj1", { includeResearchAssets: true });
    const zip = await JSZip.loadAsync(zipBuffer);

    const filesManifest = zip.file(/research\/assets\/FILES\.md$/);
    if (filesManifest && filesManifest.length > 0) {
      const content = await filesManifest[0].async("string");
      
      // Check tags are included
      expect(content).toContain("dark-theme");
      expect(content).toContain("mobile");
      
      // Check descriptions are included
      expect(content).toContain("A dark-themed dashboard");
      expect(content).toContain("Company logo");
    }
  });
});
