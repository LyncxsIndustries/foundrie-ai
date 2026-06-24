import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock octokit and db
vi.mock("@octokit/app", () => {
  const mockOctokit = {
    rest: {
      apps: {
        listReposAccessibleToInstallation: vi.fn().mockResolvedValue({
          data: { repositories: [{ id: 1, full_name: "test/repo", private: true }] },
        }),
      },
      repos: {
        get: vi.fn().mockResolvedValue({
          data: { permissions: { admin: true }, private: true },
        }),
        getContent: vi.fn().mockResolvedValue({
          data: { type: "file", content: Buffer.from("test").toString("base64"), sha: "sha", size: 4 },
        }),
      },
    },
  };

  return {
    App: class {
      getInstallationOctokit = vi.fn().mockResolvedValue(mockOctokit);
    },
  };
});

vi.mock("@/lib/ai/log", () => ({
  logEvent: vi.fn(),
}));

// Set env vars before importing the module
process.env.GITHUB_APP_ID = "123";
process.env.GITHUB_PRIVATE_KEY = "key";
process.env.GITHUB_WEBHOOK_SECRET = "secret";

let getInstallationOctokit: any;
let getRepoMetadata: any;
let readRepoFile: any;
let readRepoTree: any;
let listAuthorizedRepos: any;

describe("GitHub App Client", () => {
  beforeEach(async () => {
    vi.resetModules();
    process.env.GITHUB_APP_ID = "123";
    process.env.GITHUB_PRIVATE_KEY = "key";
    process.env.GITHUB_WEBHOOK_SECRET = "secret";
    delete (globalThis as any).githubApp;

    const mod = await import("./app-client");
    getInstallationOctokit = mod.getInstallationOctokit;
    getRepoMetadata = mod.getRepoMetadata;
    readRepoFile = mod.readRepoFile;
    readRepoTree = mod.readRepoTree;
    listAuthorizedRepos = mod.listAuthorizedRepos;
  });
  it("should initialize and return octokit", async () => {
    const octokit = await getInstallationOctokit(123);
    expect(octokit).toBeDefined();
  });

  it("should return repo metadata", async () => {
    const metadata = await getRepoMetadata(123, "owner", "repo");
    expect(metadata.access).toBe("full");
  });

  it("should list authorized repos", async () => {
    const repos = await listAuthorizedRepos(123);
    expect(repos).toHaveLength(1);
    expect(repos[0].full_name).toBe("test/repo");
  });

  it("should read repo file", async () => {
    const file = await readRepoFile(123, "owner", "repo", "path");
    expect(file.content).toBe("test");
  });
});
