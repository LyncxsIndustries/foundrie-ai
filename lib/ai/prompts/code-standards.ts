/**
 * Code Standards Generation Prompt
 * Generates context/code-standards.md for exported projects
 */

interface CodeStandardsContext {
  projectName: string;
  requirements: {
    functional: string;
    nonFunctional: string;
    hidden: string;
    scale: string;
    security: string;
  };
  architecture: {
    proposal: string;
    decisions: string;
  };
  researchFiles: Array<{
    name: string;
    summary: string;
  }>;
  hasAuth: boolean;
  hasUserOwnedData: boolean;
  hasCollaboration: boolean;
  usesNeon: boolean;
  stackSummary: string;
}

export function getCodeStandardsPrompt(context: CodeStandardsContext): string {
  return `You are generating the context/code-standards.md file for an implementation-ready project package.

PROJECT NAME: ${context.projectName}

REQUIREMENTS SUMMARY:
Functional: ${context.requirements.functional}
Non-Functional: ${context.requirements.nonFunctional}
Hidden: ${context.requirements.hidden}
Scale: ${context.requirements.scale}
Security: ${context.requirements.security}

APPROVED ARCHITECTURE:
${context.architecture.proposal}

ARCHITECTURE DECISIONS:
${context.architecture.decisions}

STACK SUMMARY:
${context.stackSummary}

PROJECT CHARACTERISTICS:
- Has Authentication: ${context.hasAuth}
- Has User-Owned Data: ${context.hasUserOwnedData}
- Has Collaboration Features: ${context.hasCollaboration}
- Uses Neon Postgres: ${context.usesNeon}

RESEARCH CONTEXT:
${context.researchFiles.length > 0 ? context.researchFiles.map(f => `- ${f.name}: ${f.summary}`).join("\n") : "No research files"}

---

Generate a comprehensive code-standards.md file that extends (NEVER summarizes or replaces) the root ARTKINS_STYLE_GUIDE.md.

CRITICAL REQUIREMENTS:

1. **Reference the Full Policy**: Start with: "This file extends the root \`ARTKINS_STYLE_GUIDE.md\` which contains the full Artkins engineering policy. Read that file first. These standards are project-specific constraints that build on top of that foundation."

2. **Adapt to the Approved Stack**: Extract the actual stack from the architecture above (languages, frameworks, database, hosting). Do NOT assume this is a Next.js/React/TypeScript/Tailwind/GSAP web app unless the architecture explicitly says so. The project could be mobile, CLI, API-only, data pipeline, ML service, or any other software shape.

3. **Stack-Specific Standards**: Based on the actual stack:
   - Language conventions and idioms
   - Framework-specific patterns
   - API design (REST/GraphQL/gRPC based on architecture)
   - Data layer patterns
   - Testing approach (unit + integration)

4. **Version Research Requirement**: "Before installing any package or framework, research the current stable version via Context7 and official release pages. Never use \\"latest\\" for model IDs. Pin exact versions."

5. **Auth & Ownership** (only if hasAuth or hasUserOwnedData):
   - Separate authentication from authorization
   - ${context.hasUserOwnedData ? "Every user-owned read/update/delete must scope by authenticated user.id" : ""}
   - ${context.hasUserOwnedData ? "Never trust userId from request input" : ""}
   - ${context.hasUserOwnedData ? "Ownership failures return 404, not 403" : ""}
   - ${context.hasCollaboration ? "Enforce Owner/Collaborator 2-role model per requirements" : ""}

6. **Database Rules** (if usesNeon):
   - Use pooled runtime URL, direct migration URL
   - Index all foreign keys
   - Use cursor pagination for lists
   - No N+1 query loops (use includes/selects)
   - Explicit select to avoid over-fetching

7. **Logging & Observability**:
   - Structured JSON logging only (no console.log in production)
   - Every request carries a UUID trace ID
   - Scrub PII before emission
   - Correlate logs by trace_id

8. **Dependency Security**:
   - npm audit (or equivalent) is a hard CI gate
   - No critical or high CVEs in production
   - Lock file committed and reviewed
   - Dependabot enabled
   - Monthly security review cadence

9. **Idempotency Patterns**:
   - Payment operations use idempotency keys
   - Email guards prevent duplicates
   - Database upserts over insert-then-update
   - Task IDs as idempotency keys
   - Buttons disable on first click

10. **Planning Gate**: "Show the user a concrete implementation plan before any implementation-impacting work (architecture changes, schema changes, API contract changes, new dependencies). Execute only after explicit approval. Discovery and passive research may continue without approval."

11. **CodeRabbit Pre-Push Gate**: "Run local CodeRabbit review (\`coderabbit review --agent\`) before every push. Fix findings by checking Context7 and official docs, NOT AI training data. Do not push until review is clean (or user explicitly overrides)."

12. **No Premature Enterprise Security**: "Do NOT implement custom admin portals, PostgreSQL RLS, ABAC, hardware-key admin, or audit logging unless requirements explicitly demand them. Auth/ownership at the application layer is sufficient for v1."

13. **File Organization**: Describe the project's directory structure based on the architecture (could be \`/src\`, \`/app\`, \`/cmd\`, \`/lib\`, \`/internal\`, etc. depending on stack).

14. **Testing Standards**: 
    - Test harness is mandatory from feature 1
    - Choose test runner based on stack (Vitest for TS, pytest for Python, cargo test for Rust, go test for Go, etc.)
    - Unit tests for core logic, integration tests for APIs
    - Tests must pass before marking feature done

15. **No-AI-Slope Enforcement**: "Generated code must be production-grade, not prototype quality. No TODO comments, no placeholder implementations, no skipped error handling, no hardcoded secrets."

OUTPUT FORMAT:
# Code Standards

[Reference to ARTKINS_STYLE_GUIDE.md]

## Stack Overview
[Actual approved stack]

## Language & Framework Standards
[Stack-specific conventions]

## Architecture Patterns
[API design, data layer, etc.]

## Auth & Authorization
[Only if applicable]

## Database
[Only if applicable, Neon-specific if usesNeon]

## Logging & Observability
[Structured logging, trace IDs, PII scrubbing]

## Security & Dependencies
[Audit gates, lock files, Dependabot]

## Idempotency
[Payment keys, email guards, etc.]

## File Organization
[Directory structure]

## Testing
[Test harness, coverage expectations]

## Development Workflow
[Planning gate, CodeRabbit gate, version research]

## Forbidden Patterns
[No premature RBAC/RLS/ABAC unless required]

## Research Citations
[Reference specific research files when design decisions came from them]

Generate the complete file now.`;
}
