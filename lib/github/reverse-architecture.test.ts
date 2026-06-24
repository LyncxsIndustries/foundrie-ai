import { describe, it, expect, vi } from "vitest";

// Mock octokit app client
vi.mock("./app-client", () => ({
  readRepoFile: vi.fn().mockImplementation((id, owner, repo, path) => {
    if (path === "package.json") {
      return { content: JSON.stringify({ name: "test" }) };
    }
    if (path === "README.md") {
      return { content: "# Readme" };
    }
    return null; // Simulate file not found
  }),
}));

vi.mock("@/lib/db", () => ({
  db: {
    diagram: {
      create: vi.fn().mockResolvedValue({ id: "123" }),
    },
  },
}));

vi.mock("@/lib/ai/log", () => ({
  logEvent: vi.fn(),
}));

import { inferArchitectureFromRepo } from "./reverse-architecture";

describe("Reverse Architecture Inference", () => {
  it("should gather context and queue diagram inference tasks", async () => {
    const result = await inferArchitectureFromRepo({
      projectId: "proj_1",
      installationId: 123,
      owner: "testowner",
      repo: "testrepo",
    });

    expect(result.success).toBe(true);
    expect(result.diagramsQueued).toBe(4);
  });
});
