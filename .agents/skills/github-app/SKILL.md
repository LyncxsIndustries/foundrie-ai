---
name: github-app
description: GitHub App two-level auth flow (JWT → installation token), Octokit API patterns, Webhook verification, and Access matrix enforcement.
---

# GitHub App Integration

This skill covers working with the GitHub App integration in Foundrie AI.

## Two-Level Auth Flow

Foundrie uses `@octokit/app` to manage the two-level authentication:
1. **App JWT**: Short-lived (10m) token signed with the App's private key. Used to request installation tokens.
2. **Installation Token**: Short-lived (1h) token used to perform actions scoped to a specific installation.

```typescript
import { githubApp } from "@/lib/github/app-client";

// Get an authenticated octokit instance for an installation
const octokit = await githubApp.getInstallationOctokit(installationId);
```

## Reading Repositories and Files

Use the helper functions from `lib/github/app-client.ts`:

```typescript
import { getRepoMetadata, readRepoFile, readRepoTree, listAuthorizedRepos } from "@/lib/github/app-client";

// List all repos the user authorized the app to access
const repos = await listAuthorizedRepos(installationId);

// Check if Foundrie has access to a specific repo
const { repository, access } = await getRepoMetadata(installationId, owner, repo);
// access: "full" | "read" | "none"

// Read a specific file (returns decoded string content)
const file = await readRepoFile(installationId, owner, repo, "README.md");
console.log(file.content);
```

## Webhooks

Webhooks are verified using `@octokit/webhooks` in `app/api/github/webhook/route.ts`. 

**Critical Next.js App Router pattern:**
- Do NOT use `req.json()` before verifying. It consumes the stream.
- Use `await req.text()` to get the raw body for HMAC verification.

```typescript
const body = await req.text();
const signature = req.headers.get("x-hub-signature-256");

await webhooks.verifyAndReceive({
  id,
  name: event as any,
  payload: body,
  signature,
});
```

## Access Matrix

Enforce this matrix on every read operation:
- **Own repos**: full access
- **Collaborator-write**: full access
- **Collaborator-read**: read-only access
- **Public**: read-only access
- **Private-other**: no access (returns 404)

Always use `requireProjectMember(projectId, userId)` in routes before reading GitHub data for a project to ensure the user has permission to perform the action in that project.
