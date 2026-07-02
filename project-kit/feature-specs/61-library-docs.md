# Feature 61 - Library Docs Context File

## Type

NEW FEATURE

## What This Delivers

Context file generator for `context/library-docs.md` containing project-specific integration patterns for third-party libraries. Documents how to use each library in the context of this specific project (not generic documentation). Covers setup, common patterns, pitfalls, authentication flows, and project-specific configurations. Reduces Context7 lookups by pre-documenting frequently-needed integration details.

## Dependencies

- Feature 23 (Architecture Context Generation) establishes tech stack.
- Feature 22 (Project Overview Generation) provides the context file generation pattern.
- All V15 library documentation (library-docs.md) already created in project-kit/context/.

## Context To Read First

- `context/library-docs.md` (Foundrie's own library docs as reference)
- `context/architecture-context.md` (Tech stack documentation)
- `context/build-plan.md` (Phase 10: Context File Generation Updates)
- `context/progress-tracker.md`

## Context7 Docs To Check

- No external libraries needed (documentation generation only)

## Files Owned

- `lib/ai/prompts/library-docs.ts`
- `lib/generation/library-docs.ts`

## Files

CREATE: `lib/ai/prompts/library-docs.ts` - system prompt for library integration documentation
CREATE: `lib/generation/library-docs.ts` - generate library-docs.md from project stack
MODIFY: `app/api/context-files/[projectId]/generate/route.ts` - add LIBRARY_DOCS case
MODIFY: `lib/ai/model-routing.ts` - add library_docs_md task
MODIFY: `context/progress-tracker.md` - mark feature progress

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract (schema fields or relations, route signatures, helper signatures, AI task names or callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, or file ownership), update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch. Do not leave future specs with stale names, old API shapes, or invalid fields.

- **CRITICAL**: Verify ContextFileType enum includes LIBRARY_DOCS. If not, add migration.
- **CRITICAL**: Only document libraries actually used in the project (no generic library docs).
- **CRITICAL**: For each library, provide project-specific examples (not copy-paste from official docs).
- **CRITICAL**: Include Context7 library IDs for each documented library (enables quick doc lookup).

### System Prompt

```typescript
// lib/ai/prompts/library-docs.ts

export function getLibraryDocsPrompt() {
  return `Generate the library-docs.md context file for this project.

PURPOSE:
Document project-specific integration patterns for third-party libraries. This is NOT generic library documentation—it's how THIS project uses each library, with concrete examples from the project's architecture.

STRUCTURE:
For each library in the tech stack, include:
1. **Library Name & Version** - exact version from package.json
2. **Purpose in This Project** - why this library vs alternatives
3. **Setup & Configuration** - project-specific config files, environment variables
4. **Common Patterns** - how this project uses the library (with code examples)
5. **Pitfalls & Gotchas** - known issues and how to avoid them
6. **Integration Examples** - concrete usage within this project's architecture
7. **Context7 Library ID** - for quick doc lookup

CRITICAL RULES:
- Only document libraries actually used in the approved architecture
- Provide project-specific examples (reference actual files, routes, components)
- For auth libraries, document the exact auth flow (OAuth, JWT, sessions, etc.)
- For databases, document the ORM/query patterns and connection pooling
- For deployment platforms, document the build/deploy pipeline
- For state management, document the store structure and data flow
- For animation libraries, document the animation patterns and performance targets
- Include file paths where each library is configured
- Never copy-paste generic documentation—adapt to this project's context
- Cite architecture-context.md for tech stack decisions

EXAMPLE SECTIONS:
## Next.js 15 (App Router)
**Version:** 15.0.3
**Purpose:** Full-stack React framework for SSR and API routes
**Config:** \`next.config.ts\` with turbopack, basePath, redirects
**Patterns:**
- Server Components for data fetching
- Route Handlers in \`app/api/**\`
- Middleware for auth checks
**Context7 ID:** /vercel/next.js

## Prisma 7 + Neon
**Version:** 7.8.0
**Purpose:** Type-safe ORM with PostgreSQL via Neon serverless driver
**Config:** \`prisma/schema.prisma\`, \`lib/db.ts\` singleton
**Patterns:**
- Pooled connection via \`@prisma/adapter-neon\`
- Transaction isolation level: Read Committed
- Soft deletes via \`deletedAt\` field
**Context7 ID:** /prisma/web

OUTPUT: Complete library-docs.md in markdown format with project-specific examples.`;
}
```

### Generation Logic

```typescript
// lib/generation/library-docs.ts

import { prisma } from '@/lib/db';
import { callAI } from '@/lib/ai';

export async function generateLibraryDocs(projectId: string, plan: string) {
  // Fetch architecture for tech stack
  const executionPlan = await prisma.executionPlan.findFirst({
    where: { projectId, status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    select: { content: true },
  });

  if (!executionPlan) {
    throw new Error('No approved architecture found');
  }

  // Fetch feature specs to understand library usage patterns
  const featureSpecs = await prisma.featureSpec.findMany({
    where: { projectId },
    orderBy: { order: 'asc' },
    select: { title: true, content: true },
    take: 10, // First 10 specs for context
  });

  // Fetch context files for additional context
  const architectureContext = await prisma.contextFile.findFirst({
    where: { projectId, fileType: 'ARCHITECTURE_CONTEXT' },
    select: { content: true },
  });

  const systemPrompt = getLibraryDocsPrompt();
  const userPrompt = `Project: ${projectId}

Architecture (approved):
${executionPlan.content}

Context File (architecture-context.md):
${architectureContext?.content || 'Not generated yet'}

Sample Feature Specs:
${featureSpecs.map(s => `${s.title}\n${s.content.slice(0, 500)}...`).join('\n\n')}

Generate library-docs.md with project-specific integration patterns for each library in the tech stack. Include exact versions, configuration files, usage examples from the architecture, and Context7 library IDs.`;

  const result = await callAI('library_docs_md', {
    systemPrompt,
    userPrompt,
    plan,
    maxTokens: 8000, // Larger for comprehensive library docs
  });

  if (result.status !== 'ok') {
    throw new Error('AI exhausted generating library docs');
  }

  return result.text;
}
```

### Library Detection Logic

**Automatically detect libraries from architecture content:**

```typescript
// Helper function to extract tech stack
function extractTechStack(architectureContent: string): string[] {
  const libraries: string[] = [];
  
  // Common patterns to detect libraries
  const patterns = [
    /next\.js/gi,
    /react/gi,
    /prisma/gi,
    /tailwind/gi,
    /clerk/gi,
    /vercel/gi,
    /liveblocks/gi,
    /gsap/gi,
    /cloudinary/gi,
    /stripe/gi,
    /zustand/gi,
    /tanstack/gi,
    /zod/gi,
    // Add more patterns as needed
  ];

  patterns.forEach(pattern => {
    if (pattern.test(architectureContent)) {
      const match = architectureContent.match(pattern);
      if (match) libraries.push(match[0].toLowerCase());
    }
  });

  return [...new Set(libraries)]; // Remove duplicates
}
```

### Context7 Library ID Mapping

**Provide Context7 IDs for common libraries:**

```typescript
const CONTEXT7_LIBRARY_IDS: Record<string, string> = {
  'next.js': '/vercel/next.js',
  'react': '/facebook/react',
  'prisma': '/prisma/web',
  'clerk': '/clerk/clerk-docs',
  'tailwind': '/tailwindlabs/tailwindcss.com',
  'shadcn': '/shadcn-ui/ui',
  'vercel': '/vercel/storage',
  'liveblocks': '/liveblocks/liveblocks',
  'gsap': '/websites/gsap',
  'cloudinary': '/cloudinary/cloudinary-docs',
  'stripe': '/stripe/stripe-docs',
  'zustand': '/pmndrs/zustand',
  'tanstack-query': '/tanstack/query',
  'zod': '/colinhacks/zod',
  'react-flow': '/xyflow/web',
  'framer-motion': '/framer/motion',
};
```

### API Route Extension

```typescript
// app/api/context-files/[projectId]/generate/route.ts

case 'LIBRARY_DOCS': {
  const content = await generateLibraryDocs(project.id, user.plan);
  
  await prisma.contextFile.upsert({
    where: {
      projectId_fileType: {
        projectId: project.id,
        fileType: 'LIBRARY_DOCS',
      },
    },
    create: {
      projectId: project.id,
      fileType: 'LIBRARY_DOCS',
      content,
    },
    update: { content },
  });

  return Response.json({ content });
}
```

### Database Schema

**Verify ContextFileType enum includes LIBRARY_DOCS:**

```prisma
enum ContextFileType {
  PROJECT_OVERVIEW
  ARCHITECTURE_CONTEXT
  CODE_STANDARDS
  UI_TOKENS
  UI_RULES
  UI_REGISTRY
  LIBRARY_DOCS          // NEW
  AI_WORKFLOW_RULES
  PROGRESS_TRACKER
}
```

**Migration needed:** Add LIBRARY_DOCS to enum if not present.

### Example Generated Content

**Sample library-docs.md structure:**

```markdown
# Library Documentation

## Next.js 15 (App Router)
**Version:** 15.0.3 (from package.json)
**Purpose:** Full-stack React framework for SSR, API routes, and optimal performance
**Config Files:** \`next.config.ts\`, \`app/layout.tsx\`
**Environment Variables:** \`NEXT_PUBLIC_APP_URL\`

### Server Components Pattern
```typescript
// app/projects/[id]/page.tsx
export default async function ProjectPage({ params }) {
  const project = await db.project.findUnique({ where: { id: params.id } });
  return <ProjectDetails project={project} />;
}
```

**Context7 ID:** /vercel/next.js

---

## Prisma 7 + Neon
**Version:** 7.8.0
**Purpose:** Type-safe ORM with serverless PostgreSQL
**Config Files:** \`prisma/schema.prisma\`, \`lib/db.ts\`
**Environment Variables:** \`DATABASE_URL\` (pooled), \`DIRECT_URL\` (direct)

### Connection Pattern
```typescript
import { PrismaNeon } from '@prisma/adapter-neon';
const adapter = new PrismaNeon(pool);
export const db = new PrismaClient({ adapter });
```

**Context7 ID:** /prisma/web

---

## Clerk (Authentication)
**Version:** 7.4.3
**Purpose:** User authentication and session management
**Config Files:** \`middleware.ts\`, \`app/layout.tsx\`
**Environment Variables:** \`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY\`, \`CLERK_SECRET_KEY\`

### Middleware Protection
```typescript
export default clerkMiddleware((auth, req) => {
  if (!publicRoutes.includes(req.nextUrl.pathname)) {
    auth().protect();
  }
});
```

**Context7 ID:** /clerk/clerk-docs
```

## Out of Scope

- Generating code snippets from library docs (only documentation)
- Real-time library version checking (uses versions from approved architecture)
- Library vulnerability scanning (use npm audit separately)

## Future Modifications

- Future features may add automatic library version updates with migration guides
- Future features may integrate with npm/yarn to detect installed versions
- Future features may add library usage analytics (which libraries used most)

## Quality Gates

- Run `npm run test` and ensure it passes (minimum 5 new tests: 1 prompt, 1 generator, 3 API routes)
- Run `npm run build` and ensure it passes
- Run `npm run security:all` and ensure it passes before push
- Test with various tech stacks (React only, full-stack, mobile, backend)
- Verify Context7 library IDs are correct

## Acceptance Criteria

- [ ] ContextFileType enum includes LIBRARY_DOCS
- [ ] getLibraryDocsPrompt() returns comprehensive system prompt with structure
- [ ] generateLibraryDocs() fetches approved architecture and feature specs
- [ ] Generator extracts tech stack from architecture content
- [ ] Generated docs include exact library versions
- [ ] Generated docs include project-specific configuration files
- [ ] Generated docs include common usage patterns with code examples
- [ ] Generated docs include Context7 library IDs for each library
- [ ] Only libraries actually used in the project are documented
- [ ] Examples reference actual project files (not generic examples)
- [ ] Auth libraries include the complete auth flow
- [ ] Database libraries include connection patterns and query examples
- [ ] Animation libraries include performance targets and patterns
- [ ] API route handles LIBRARY_DOCS case
- [ ] ZIP export includes library-docs.md in /context folder
- [ ] Non-owner access returns 404 (owner-only generation)
- [ ] `context/progress-tracker.md` updated to mark feature DONE
- [ ] `npm run build` passes with no warnings
- [ ] CodeRabbit review completed (recommended quality gate)