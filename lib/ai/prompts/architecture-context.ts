/**
 * Architecture Context Generation Prompt
 * Generates context/architecture-context.md for exported projects
 */

interface ArchitectureContextInput {
  projectName: string;
  requirements: {
    functional: string;
    nonFunctional: string;
    hidden: string;
    scale: string;
    security: string;
  };
  architecture?: {
    proposal: string;
    critique: string;
  };
  diagrams: {
    hasSystemContext: boolean;
    hasContainer: boolean;
    hasERD: boolean;
    hasAPIMap: boolean;
    apiMapExport?: string;
    hasSecurity: boolean;
    totalCount: number;
  };
  researchFiles: Array<{
    name: string;
    path: string;
    summary: string;
  }>;
}

export function getArchitectureContextPrompt(
  context: ArchitectureContextInput
): string {
  return `You are generating the context/architecture-context.md file for an implementation-ready project package.

PROJECT NAME: ${context.projectName}

REQUIREMENTS ANALYSIS:
Functional: ${context.requirements.functional}

Non-Functional: ${context.requirements.nonFunctional}

Hidden Requirements: ${context.requirements.hidden}

Scale: ${context.requirements.scale}

Security: ${context.requirements.security}

${
  context.architecture
    ? `ARCHITECTURE PROPOSAL:
${context.architecture.proposal}

ARCHITECTURE CRITIQUE:
${context.architecture.critique}`
    : "ARCHITECTURE: Not yet proposed"
}

DIAGRAMS GENERATED:
- Total: ${context.diagrams.totalCount}
- System Context: ${context.diagrams.hasSystemContext ? "Yes" : "No"}
- Container: ${context.diagrams.hasContainer ? "Yes" : "No"}
- ERD: ${context.diagrams.hasERD ? "Yes" : "No"}
- API Map: ${context.diagrams.hasAPIMap ? "Yes" : "No"}
- Security Architecture: ${context.diagrams.hasSecurity ? "Yes" : "No"}

${
  context.diagrams.apiMapExport
    ? `API MAP EXPORT (OpenAPI):
${context.diagrams.apiMapExport}`
    : ""
}

RESEARCH FILES:
${
  context.researchFiles.length > 0
    ? context.researchFiles
        .map((f) => `- ${f.name} (${f.path}): ${f.summary}`)
        .join("\n")
    : "No research files"
}

---

Generate a comprehensive architecture-context.md file with these sections:

1. **# Architecture Context**

2. **## Stack Decision**
   - **CRITICAL: NEVER assume this project uses Foundrie's stack (Rust/Python/TypeScript/Go/Next.js)**
   - Base the stack ONLY on the architecture proposal provided
   - Include a researched stack decision section:
     * User preferences mentioned in requirements
     * Candidate technologies that were considered
     * Context7 and official version/install evidence (cite specific versions)
     * Selected stack and version strategy
     * Why the selected stack fits the project's needs
     * Why rejected alternatives were NOT selected
   - If no architecture is proposed yet, write: "Stack will be selected through research and approval"
   - Cite sources for every recommendation

3. **## System Boundaries**
   - Application layers and their responsibilities
   - Component structure
   - Module organization
   - Service boundaries (if microservices/distributed)

4. **## Database and Storage**
   - Database choice and rationale
   - Schema approach
   - If Prisma is selected: enforce Prisma 7 standard (minimalist schema.prisma datasource, URLs in prisma.config.ts)
   - Storage strategy for files/artifacts
   - Caching strategy if applicable

5. **## Authentication and Authorization** (ONLY if the project has auth requirements)
   - Separate authentication (identity provider) from authorization (application-layer logic)
   - If user-owned data exists: include ownership invariant (scope by authenticated local user ID, ownership failure returns 404)
   - If collaboration is needed: 2-role Owner/Collaborator model via application-layer helpers, NOT PostgreSQL RLS
   - Do NOT generate enterprise RBAC, RLS, ABAC, audit logs, or custom admin architecture UNLESS requirements explicitly need them

6. **## API Architecture** (if API Map diagram exists)
   - API design approach (REST/GraphQL/gRPC)
   - Route structure
   - Include the API map from the OpenAPI export when available
   - Request/response patterns
   - Error handling strategy

7. **## Security Architecture** (if Security diagram exists or security requirements present)
   - Seven-layer security mapping:
     * Network (DDoS, WAF, rate limiting)
     * Transport (TLS, certificates)
     * Authentication (provider, sessions)
     * Authorization (scoping, ownership)
     * Application (input validation, CSRF, XSS)
     * Data (encryption at rest, PII handling)
     * Infrastructure (secrets, env vars, deployment)
   - Only include layers relevant to this project

8. **## Core Invariants**
   - Technical rules that must never be violated
   - Data consistency guarantees
   - Security boundaries
   - Performance requirements

9. **## Architectural Risks**
   - Potential failure modes
   - Scalability bottlenecks
   - Security concerns
   - Technical debt areas
   - Mitigation strategies

10. **## Research Basis**
    - List research files that informed architecture decisions
    - Cite specific paths: research/[category]/[filename]
    - Explain how research influenced the design
    - If no research: "No research artifacts referenced"

---

CRITICAL RULES:
1. Write in clear, professional technical documentation style
2. Use Markdown formatting with proper headers (# ## ###)
3. Use bullet lists (-, not *) and numbered lists (1. 2. 3.)
4. Be specific and concrete - cite exact versions, specific patterns, concrete decisions
5. **NEVER assume Foundrie's technology stack - analyze the architecture proposal provided**
6. **DO NOT default to web/React/Next.js/TypeScript/Tailwind/GSAP**
7. Include auth/authorization sections ONLY when the project actually needs them
8. Do not over-engineer with RBAC/RLS/audit logs unless explicitly required
9. Cite sources for all recommendations (benchmarks, case studies, documented best practices)
10. Reference research files by actual paths when they influenced decisions
11. If information is missing, state that explicitly
12. Return ONLY the markdown content, no JSON wrapper, no explanations

Generate the architecture-context.md content now:`;
}
