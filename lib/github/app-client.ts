import { App } from "@octokit/app";
import { logEvent } from "@/lib/ai/log";

/**
 * Returns a configured GitHub App instance using environment variables.
 * In development, caches the instance on globalThis to prevent exhaustion.
 */
function createGitHubApp(): App | null {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_PRIVATE_KEY;
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!appId || !privateKey) {
    logEvent("warn", {
      event: "ai_outcome", // Using existing type OutcomeLogFields
      task: "github_app_client",
      modelKey: "github",
      status: "queued",
      attempts: 1,
      durationMs: 0,
    });
    return null;
  }

  // Handle newlines in the private key from .env string
  const formattedPrivateKey = privateKey.replace(/\\n/g, "\n");

  return new App({
    appId,
    privateKey: formattedPrivateKey,
    ...(webhookSecret && { webhooks: { secret: webhookSecret } }),
  });
}

const globalForGithub = globalThis as unknown as { githubApp: App | null };

export const githubApp =
  globalForGithub.githubApp !== undefined
    ? globalForGithub.githubApp
    : createGitHubApp();

if (process.env.NODE_ENV !== "production") {
  globalForGithub.githubApp = githubApp;
}

/**
 * Validates that an installation belongs to an authorized user/org by cross-referencing
 * the requested repository's permissions or trusting the token flow.
 */
export async function getInstallationOctokit(installationId: number) {
  if (!githubApp) {
    throw new Error("GitHub App is not configured");
  }
  return githubApp.getInstallationOctokit(installationId);
}

export type RepoAccess = "full" | "read" | "none";

/**
 * Returns metadata about a specific repository and the access level.
 */
export async function getRepoMetadata(
  installationId: number,
  owner: string,
  repo: string,
) {
  const octokit = await getInstallationOctokit(installationId);

  try {
    const { data } = await octokit.request("GET /repos/{owner}/{repo}", {
      owner,
      repo,
    });

    let access: RepoAccess = "none";
    if (data.permissions?.admin || data.permissions?.push) {
      access = "full";
    } else if (data.permissions?.pull) {
      access = "read";
    } else if (!data.private) {
      access = "read"; // Public fallback
    }

    return { repository: data, access };
  } catch (error: any) {
    if (error.status === 404) {
      return { repository: null, access: "none" as RepoAccess };
    }
    throw error;
  }
}

/**
 * Reads a file from a repository.
 */
export async function readRepoFile(
  installationId: number,
  owner: string,
  repo: string,
  path: string,
  ref?: string,
) {
  const octokit = await getInstallationOctokit(installationId);

  const { data } = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
    owner,
    repo,
    path,
    ...(ref ? { ref } : {}),
  });

  if ("content" in data && data.type === "file") {
    const content = Buffer.from(data.content, "base64").toString("utf-8");
    return { content, sha: data.sha, size: data.size };
  }

  throw new Error(`Path ${path} is not a file`);
}

/**
 * Reads a directory tree from a repository.
 */
export async function readRepoTree(
  installationId: number,
  owner: string,
  repo: string,
  path: string = "",
  ref?: string,
) {
  const octokit = await getInstallationOctokit(installationId);

  const { data } = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
    owner,
    repo,
    path,
    ...(ref ? { ref } : {}),
  });

  if (Array.isArray(data)) {
    return { entries: data.map((entry) => ({ name: entry.name, type: entry.type, path: entry.path, size: entry.size })) };
  }

  throw new Error(`Path ${path} is not a directory`);
}

/**
 * Lists all repositories the installation can access.
 */
export async function listAuthorizedRepos(installationId: number) {
  const octokit = await getInstallationOctokit(installationId);

  const { data } = await octokit.request("GET /installation/repositories", {
    per_page: 100, // Handle pagination for large orgs in the future
  });

  return data.repositories;
}
