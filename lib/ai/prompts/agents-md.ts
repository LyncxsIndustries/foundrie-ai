/**
 * AGENTS.md Generation Prompt
 * Generates root AGENTS.md agent entry point for exported projects
 */

interface AgentsMDContext {
  projectName: string;
  requirements: {
    functional: string;
    nonFunctional: string;
    hidden: string;
    scale: string;
    security: string;
  };
  architecture: {
    content: string;
    stack: string;
    hasAuth: boolean;
    hasUserOwnedData: boolean;
    usesNeon: boolean;
  };
  diagrams: Array<{
    category: string;
    typeId: string;
    name: string;
  }>;
  contextFiles: Array<{
    type: string;
    content: string;
  }>;
  featureSpecs: Array<{
    order: number;
    title: string;
    slug: string;
  }>;
  skills: {
    universal: string[];
    stackDependent: string[];
    custom: string[];
  };
  researchFiles: Array<{
    name: string;
    sourceType: string;
  }>;
  envVars: Array<{
    name: string;
    source: string;
  }>;
  cliTools: Array<{
    name: string;
    installCommand: string;
  }>;
  accounts: Array<{
    service: string;
    setupUrl: string;
  }>;
}

export function getAgentsMDPrompt(context: AgentsMDContext): string {
  const diagramsByCategory = context.diagrams.reduce((acc, d) => {
    if (!acc[d.category]) acc[d.category] = [];
    acc[d.category].push(d);
    return acc;
  }, {} as Record<string, typeof context.diagrams>);

  return `You are generating the root AGENTS.md agent entry point for an implementation-ready project package.

This file guides the downstream coding agent (RUWA) through implementation with seven required sections.

PROJECT NAME: ${context.projectName}

ARCHITECTURE STACK:
${context.architecture.stack}

HAS AUTHENTICATION: ${context.architecture.hasAuth}
HAS USER-OWNED DATA: ${context.architecture.hasUserOwnedData}
USES NEON POSTGRES: ${context.architecture.usesNeon}

REQUIREMENTS SUMMARY:
${context.requirements.functional}

NON-FUNCTIONAL REQUIREMENTS:
${context.requirements.nonFunctional}

HIDDEN REQUIREMENTS:
${context.requirements.hidden}

DIAGRAMS PRESENT:
${Object.entries(diagramsByCategory)
  .map(([cat, diagrams]) => `${cat}: ${diagrams.map(d => d.name).join(", ")}`)
  .join("\n")}

CONTEXT FILES:
${context.contextFiles.map(c => `- ${c.type}`).join("\n")}

FEATURE SPECS (${context.featureSpecs.length} total):
${context.featureSpecs.slice(0, 10).map(f => `${f.order}. ${f.title}`).join("\n")}
${context.featureSpecs.length > 10 ? `... (${context.featureSpecs.length - 10} more)` : ""}

PROVISIONED SKILLS:
Universal: ${context.skills.universal.join(", ")}
Stack-Dependent: ${context.skills.stackDependent.join(", ")}
Custom: ${context.skills.custom.join(", ")}

RESEARCH FILES:
${context.researchFiles.map(r => `- ${r.name} (${r.sourceType})`).join("\n")}

ENVIRONMENT VARIABLES:
${context.envVars.map(e => `- ${e.name}: ${e.source}`).join("\n")}

CLI TOOLS REQUIRED:
${context.cliTools.map(t => `- ${t.name}: ${t.installCommand}`).join("\n")}

ACCOUNTS REQUIRED:
${context.accounts.map(a => `- ${a.service}: ${a.setupUrl}`).join("\n")}

---

Generate a complete AGENTS.md file with these SEVEN REQUIRED SECTIONS:

## SECTION 1: PROJECT IDENTITY
- Single paragraph describing what this project is, its purpose, and its users
- Reference the approved stack from architecture-context.md
- State "This project uses [stack] as researched and approved during discovery"
- Never assume this is a web app, React, Next.js, or Foundrie's stack unless explicitly documented

## SECTION 2: MANDATORY READING ORDER
List required reading in this exact order:
1. Root ARTKINS_STYLE_GUIDE.md (full engineering policy)
2. research/PROJECT_RESEARCH.md (research index)
3. All diagrams BEFORE context files (diagram-first methodology):
   - System Context diagram (always first)
   - Container diagram
   - ERD diagram
   - API Map diagram
   - Other diagrams by category
4. Context files in this order:
   - context/project-overview.md
   - context/architecture-context.md
   - context/code-standards.md
   - context/ui-context.md (if applicable to platform)
   - context/ai-workflow-rules.md
   - context/progress-tracker.md
5. Feature specs (read current numbered spec only, implement one at a time)

## SECTION 3: INIT PLAN DATA
This section ensures RUWA has everything before starting Feature 01.

### Environment Variables
List every environment variable with its exact source:
${context.envVars.map(e => `- \`${e.name}\`: ${e.source}`).join("\n")}

### CLI Tools
List every required CLI tool with install command:
${context.cliTools.map(t => `- ${t.name}: \`${t.installCommand}\``).join("\n")}

### Required Accounts
List every service requiring signup:
${context.accounts.map(a => `- ${a.service}: ${a.setupUrl}`).join("\n")}

### Gate Sentence
End with: "Tell me 'ready' when you have completed the above, and I will begin Feature 01."

## SECTION 4: HARD RULES

### Planning Gate
Show the user a concrete plan before implementation-impacting work. Wait for explicit approval. If the user revises the plan, update and re-present before executing.

### Branch-First Git Workflow
Create the feature branch BEFORE writing any code:
\`git checkout master && git pull && git checkout -b feature/NN-slug\`

Never commit directly to master. Every feature gets its own branch.

### One Spec At A Time
Implement features in strict numeric order. Do not skip ahead, batch specs, or start the next spec until the current one passes review.

For every feature:
1. Read only the current numbered spec
2. Create feature branch
3. Present plan and wait for approval
4. Implement within scope
5. Write tests for core logic, API routes, critical paths
6. Run \`npm run test\` and \`npm run build\`
7. Update progress-tracker.md ON THE BRANCH (mark current DONE, set next as Current Goal)
8. Commit implementation + tracker update together on feature branch
9. Push to GitHub
10. CodeRabbit review (recommended quality gate)
11. Fix all findings, push again
12. User merges PR to master
13. Sync local master before next spec

### Context7-Driven Planning
Before installing or pinning ANY package version, use Context7 and official sources to verify current stable versions:
\`npx ctx7 library <name> "<specific question>"\`
\`npx ctx7 docs <libraryId> "<specific question>"\`

Never use \`"latest"\` in model IDs or package versions. Always pin exact versions.

Check .agents/skills/ for relevant skills before implementing (e.g., clerk-nextjs-patterns, prisma-client-api, trigger-tasks).

### User-Input-First Philosophy
Never assume credentials, API keys, or config values. Always ask the user for required inputs. When a spec requires external setup, provide step-by-step instructions.

### Authentication & Authorization
${context.architecture.hasAuth ? `
Clerk owns authentication; application code owns authorization.
Every user-owned read, update, delete must scope by authenticated local \`user.id\`.
Never trust \`userId\` from request input.
Ownership failures return 404, not 403.
` : "This project does not use authentication."}

${context.architecture.hasUserOwnedData ? `
Use \`requireProjectOwner()\` for owner-only operations.
Use \`requireProjectMember()\` for shared operations.
Scope all queries: \`where: { projectId, userId: user.id }\`
` : ""}

### No Premature Enterprise Security
Do not build custom admin portals, PostgreSQL RLS, ABAC, audit logs, or hardware-key admin controls unless a feature spec explicitly requires them.

### Structured Logging
Use structured JSON logging only. No \`console.log\`.
Every request carries a UUID request ID.
PII is scrubbed before emission.

### Dependency Audit Gate
Run \`npm audit\` before every push.
No critical or high CVEs allowed.
Never delete or gitignore package-lock.json.

### Diagram-First Rule
RUWA reads diagrams before context files.
Never implement a table, route, or component not present in the corresponding diagram.

### Spec Structure
Every spec has:
- Exact dependencies (no "requires Feature X-Y")
- Exact files owned (no overlap between specs)
- Out of Scope section
- Future Modifications section
- Binary acceptance criteria
- MODIFICATION labels when changing existing files

## SECTION 5: FEATURE ORDER
Implement these ${context.featureSpecs.length} features in strict numeric order:

${context.featureSpecs.map(f => `${f.order}. ${f.title}`).join("\n")}

## SECTION 6: STACK REFERENCE

This project uses the following stack (from architecture-context.md):
${context.architecture.stack}

${context.architecture.usesNeon ? `
### Database
- Neon Postgres with Prisma ORM
- Pooled \`DATABASE_URL\` for runtime queries
- Direct \`DIRECT_URL\` for migrations/studio
- Use \`npm run db:generate\`, \`npm run db:migrate\`, \`npm run db:studio\`
` : ""}

### Context7 Library IDs
Before installing packages, verify current versions via Context7.
Use these library IDs when available:
${context.architecture.stack.includes("Next.js") ? "- /vercel/next.js" : ""}
${context.architecture.hasAuth ? "- /clerk/clerk-docs" : ""}
${context.architecture.usesNeon ? "- /prisma/web\n- /websites/neon" : ""}

## SECTION 7: RESEARCH FILES

Research assets are implementation inputs. Reference them when design, motion, source, or technical decisions depend on research.

Available research:
${context.researchFiles.map(r => `- ${r.name} (${r.sourceType})`).join("\n")}

Research files live in \`research/\` and provide:
- Visual references for UI implementation
- Motion plans for animation
- Technical research for architecture decisions
- Source material for product decisions

### Provisioned Agent Skills

This project includes ${context.skills.universal.length + context.skills.stackDependent.length + context.skills.custom.length} agent skills in \`.agents/skills/\`:

**Universal Skills** (${context.skills.universal.length}):
${context.skills.universal.map(s => `- ${s}`).join("\n")}

**Stack-Dependent Skills** (${context.skills.stackDependent.length}):
${context.skills.stackDependent.map(s => `- ${s}`).join("\n")}

**Custom Skills** (${context.skills.custom.length}):
${context.skills.custom.map(s => `- ${s}`).join("\n")}

Always check \`.agents/skills/\` for a relevant skill before implementing, debugging, or changing code. Read the SKILL.md file and follow its patterns exactly.

---

CRITICAL REQUIREMENTS:
1. Never assume this is a web app, React, Next.js, TypeScript, or Foundrie's own stack
2. Adapt all guidance to the approved stack from architecture-context.md
3. Include auth/ownership sections ONLY if the project uses them
4. Include UI context reading ONLY if the platform has a UI (not CLI/API-only)
5. List exact env vars, CLI tools, and accounts from the provided lists
6. End Init Plan with the gate sentence exactly as written
7. Model IDs must never contain "latest"
8. All seven sections must be present

Output a complete, production-ready AGENTS.md file.`;
}
