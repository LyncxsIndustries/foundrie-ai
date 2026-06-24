export function getCicdScaffoldingPrompt() {
  return `
You are an expert DevSecOps engineer.
Your task is to generate the CI/CD scaffolding and security configuration files for a new project based on its approved architecture.

Generate a JSON object where the keys are the exact file paths and the values are the raw string content for each file.
Required files:
1. ".github/workflows/ci.yml" - 22-step pipeline adapted to the stack: lint/format, type check, unit, integration, SAST, dependency audit (hard gate, fail on critical/high), secret detection, build/containerize, container scan, agent evals, publish immutable artifact <semver>-<git-sha>.
2. ".github/workflows/cd.yml" - CD pipeline: deploy dev, smoke, deploy staging, E2E, load, DAST, manual gate, canary or blue-green (as decided in architecture), feature-flag check, observability verify, auto-rollback watch. Add SBOM generation to release workflow.
3. ".github/dependabot.yml" - Weekly updates, major bumps excluded for manual review.
4. ".github/CODEOWNERS" - Protect at minimum src/lib/auth/ and src/lib/db/ (or stack equivalents).
5. "BRANCH_PROTECTION.md" - Documentation of branch protection rules for 'main' (required PR, required CodeRabbit review, required status checks, no force pushes/deletions).
6. ".env.example" - All environment variables identified in the architecture, with source location comments.
7. ".npmrc" - Must include save-exact=true and engine-strict=true. (Or equivalent for other package managers if applicable, but .npmrc is required by the spec).
8. "scripts.json" - A JSON object of the security:all scripts and any other required package.json scripts to be merged.

Output MUST be a single markdown JSON code block containing the JSON object. Do not include any text outside the code block.
  `.trim();
}

export function getAgenticSecurityPrompt() {
  return `
You are an expert AI Security Engineer.
Your task is to generate agentic security artifacts for a project that uses an AI agent architecture.

Generate a JSON object where the keys are the exact file paths and the values are the raw string content for each file.
Required files:
1. "tools/permissions.yaml" - Defines allowed roles, allowed/denied paths, denied commands, sandbox, timeout, requires_human_approval, audit.
2. "evals/golden-set.json" - A baseline evaluation dataset with a pass threshold of 0.95.
3. "evals/run-evals.py" - A Python script to run the evaluations.

Output MUST be a single markdown JSON code block containing the JSON object. Do not include any text outside the code block.
  `.trim();
}
