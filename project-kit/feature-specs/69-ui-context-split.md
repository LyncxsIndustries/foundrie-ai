# Feature 69 - UI Context File Split (ui-tokens, ui-rules, ui-registry)

## Type

MODIFICATION (modifies Feature 24 - UI Context Generation)

## What This Delivers

Splits the monolithic `ui-context.md` into three specialized context files: `ui-tokens.md` (design tokens, colors, typography, spacing, shadows), `ui-rules.md` (layout patterns, behavior rules, accessibility), and `ui-registry.md` (component catalog with usage examples). This increases context clarity, reduces file size, and allows AI agents to load only relevant UI documentation for specific tasks.

## Dependencies

- Feature 24 (UI Context Generation) provides the base UI context generator.
- Feature 22 (Project Overview Generation) establishes the context file generation pattern.
- All V15 UI documentation (ui-tokens.md, ui-rules.md, ui-registry.md) already created in project-kit/context/.

## Context To Read First

- `context/ui-tokens.md` (new file, reference for generation)
- `context/ui-rules.md` (new file, reference for generation)
- `context/ui-registry.md` (new file, reference for generation)
- `context/architecture-context.md` (Context file structure)
- `context/build-plan.md` (Phase 10: Context File Generation Updates)
- `context/progress-tracker.md`

## Context7 Docs To Check

- No external libraries needed (documentation generation only)

## Files Owned

- `lib/ai/prompts/ui-tokens.ts`
- `lib/ai/prompts/ui-rules.ts`
- `lib/ai/prompts/ui-registry.ts`
- `lib/generation/ui-tokens.ts`
- `lib/generation/ui-rules.ts`
- `lib/generation/ui-registry.ts`

## Files

CREATE: `lib/ai/prompts/ui-tokens.ts` - system prompt for design tokens generation
CREATE: `lib/ai/prompts/ui-rules.ts` - system prompt for UI behavior rules generation
CREATE: `lib/ai/prompts/ui-registry.ts` - system prompt for component catalog generation
CREATE: `lib/generation/ui-tokens.ts` - generate ui-tokens.md from project data
CREATE: `lib/generation/ui-rules.ts` - generate ui-rules.md from project data
CREATE: `lib/generation/ui-registry.ts` - generate ui-registry.md from project data
MODIFY: `app/api/context-files/[projectId]/generate/route.ts` - add UI_TOKENS, UI_RULES, UI_REGISTRY cases
MODIFY: `lib/ai/model-routing.ts` - add ui_tokens_md, ui_rules_md, ui_registry_md tasks
MODIFY: `lib/zip/build-project-zip.ts` - include all 3 UI context files in export
MODIFY: `context/progress-tracker.md` - mark feature progress

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract (schema fields or relations, route signatures, helper signatures, AI task names or callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, or file ownership), update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch. Do not leave future specs with stale names, old API shapes, or invalid fields.

- **CRITICAL**: Verify ContextFileType enum includes UI_TOKENS, UI_RULES, UI_REGISTRY. If not, add migration.
- **CRITICAL**: Each UI context file must be independently useful (no cross-file dependencies for basic usage).
- **CRITICAL**: ui-tokens.md is read first, then ui-rules.md, then ui-registry.md (precedence order).
- **CRITICAL**: Generated files must reference Foundrie's own ui-tokens/rules/registry as examples but adapt to project's actual design system.

### System Prompts

**ui-tokens.md Prompt:**

```typescript
// lib/ai/prompts/ui-tokens.ts

export function getUITokensPrompt() {
  return `Generate the ui-tokens.md context file for this project.

STRUCTURE:
1. Color Palette - primary, secondary, background layers, text hierarchy, borders, status colors
2. Typography - font families, type scale with sizes/weights/line-heights
3. Spacing Scale - consistent spacing units (4px, 8px, 16px, etc.)
4. Border Radius - corner radius values (sm, md, lg, xl, full)
5. Shadows - elevation shadows with multiple layers
6. Glass Morphism - backdrop-blur patterns (if applicable)
7. Motion & Animation - durations, easing functions, transitions
8. Z-Index Scale - layering system for overlays/modals/tooltips
9. Responsive Breakpoints - mobile, tablet, desktop breakpoints

CRITICAL RULES:
- Extract colors from project's visual research and branding assets
- If no design system exists, suggest a cohesive palette based on industry standards
- Define Tailwind-compatible token structure when applicable
- Include CSS custom properties format
- For dark-themed projects, include proper contrast ratios (WCAG AA minimum)
- Never default to Foundrie's Lynx Theme Pro unless user explicitly chose it
- Cite research files that influenced color/typography choices

OUTPUT: Complete ui-tokens.md in markdown format with code examples.`;
}
```

**ui-rules.md Prompt:**

```typescript
// lib/ai/prompts/ui-rules.ts

export function getUIRulesPrompt() {
  return `Generate the ui-rules.md context file for this project.

STRUCTURE:
1. Layout Patterns - scrolling behavior, fixed headers, responsive grids
2. Loading States - skeleton loaders, spinners, progress indicators
3. Error States - inline errors, toast notifications, error boundaries
4. Empty States - illustrations, messaging, CTAs when no data
5. Form Validation - real-time vs submit validation, feedback patterns
6. Modal & Dialog Patterns - usage rules, mobile considerations
7. Responsive Design Rules - mobile-first approach, breakpoint usage, touch targets
8. Animation Rules - when to animate, duration limits, performance targets
9. Accessibility Rules - WCAG 2.1 AA compliance, keyboard nav, screen readers
10. Performance Rules - image optimization, lazy loading, virtual lists

CRITICAL RULES:
- Adapt layout patterns to project type (web app, mobile, desktop, landing page)
- For real-time apps, include presence indicators and optimistic updates
- For e-commerce, include cart/checkout UX patterns
- For content platforms, include reading modes and typography rules
- Include touch-friendly sizing for mobile apps (min 44x44px)
- Never assume web-only (adapt to actual platform from architecture)
- Reference ui-tokens.md for colors/spacing but don't duplicate token definitions

OUTPUT: Complete ui-rules.md in markdown format with examples.`;
}
```

**ui-registry.md Prompt:**

```typescript
// lib/ai/prompts/ui-registry.ts

export function getUIRegistryPrompt() {
  return `Generate the ui-registry.md context file for this project.

STRUCTURE:
1. Component Categories - primitives, layout, forms, data display, feedback, navigation, media
2. Component Catalog - each component with:
   - Name and location
   - Props with types
   - Usage example
   - When to use (decision tree)
   - Variants/sizes
   - Accessibility notes
3. Component Decision Tree - flow chart for selecting right component

CRITICAL RULES:
- List only components needed for this project (don't include unused components)
- If using shadcn/ui, document which components are installed
- If using custom components, provide complete prop interfaces
- Include platform-specific components (SwiftUI, React Native, etc.)
- For each component, show actual usage code (not just props list)
- Group by purpose, not by file location
- Reference ui-tokens.md for styling but focus on component behavior
- Include component composition examples (how components work together)

OUTPUT: Complete ui-registry.md in markdown format with code examples.`;
}
```

### Generation Logic

**ui-tokens.ts Generator:**

```typescript
// lib/generation/ui-tokens.ts

import { prisma } from '@/lib/db';
import { callAI } from '@/lib/ai';

export async function generateUITokens(projectId: string, plan: string) {
  // Fetch visual research
  const researchFiles = await prisma.researchFile.findMany({
    where: {
      projectId,
      category: { in: ['branding', 'inspiration'] },
    },
    select: {
      fileName: true,
      category: true,
      aiDescription: true,
    },
  });

  // Fetch architecture for tech stack
  const executionPlan = await prisma.executionPlan.findFirst({
    where: { projectId, status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    select: { content: true },
  });

  const systemPrompt = getUITokensPrompt();
  const userPrompt = `Project: ${projectId}
Visual Research: ${researchFiles.map(f => `${f.fileName}: ${f.aiDescription}`).join('\n')}
Architecture: ${executionPlan?.content || 'Not specified'}

Generate ui-tokens.md with a cohesive design system based on this project's visual research and tech stack.`;

  const result = await callAI('ui_tokens_md', {
    systemPrompt,
    userPrompt,
    plan,
    maxTokens: 4000,
  });

  if (result.status !== 'ok') {
    throw new Error('AI exhausted generating UI tokens');
  }

  return result.text;
}
```

**ui-rules.ts Generator:**

```typescript
// lib/generation/ui-rules.ts

export async function generateUIRules(projectId: string, plan: string) {
  // Fetch requirements for project type
  const requirements = await prisma.requirements.findUnique({
    where: { projectId },
    select: { content: true },
  });

  // Fetch architecture for platform info
  const executionPlan = await prisma.executionPlan.findFirst({
    where: { projectId, status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    select: { content: true },
  });

  const systemPrompt = getUIRulesPrompt();
  const userPrompt = `Project: ${projectId}
Requirements: ${requirements?.content ? JSON.stringify(requirements.content) : 'Not specified'}
Architecture: ${executionPlan?.content || 'Not specified'}

Generate ui-rules.md with layout patterns, behavior rules, and accessibility standards appropriate for this project type and platform.`;

  const result = await callAI('ui_rules_md', {
    systemPrompt,
    userPrompt,
    plan,
    maxTokens: 6000,
  });

  if (result.status !== 'ok') {
    throw new Error('AI exhausted generating UI rules');
  }

  return result.text;
}
```

**ui-registry.ts Generator:**

```typescript
// lib/generation/ui-registry.ts

export async function generateUIRegistry(projectId: string, plan: string) {
  // Fetch feature specs to identify needed components
  const featureSpecs = await prisma.featureSpec.findMany({
    where: { projectId },
    orderBy: { order: 'asc' },
    select: { title: true, content: true },
  });

  // Fetch architecture for tech stack
  const executionPlan = await prisma.executionPlan.findFirst({
    where: { projectId, status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    select: { content: true },
  });

  const systemPrompt = getUIRegistryPrompt();
  const userPrompt = `Project: ${projectId}
Feature Specs: ${featureSpecs.map(s => s.title).join(', ')}
Architecture: ${executionPlan?.content || 'Not specified'}

Generate ui-registry.md cataloging only the components needed for the features defined in this project. Include props, usage examples, and decision trees.`;

  const result = await callAI('ui_registry_md', {
    systemPrompt,
    userPrompt,
    plan,
    maxTokens: 6000,
  });

  if (result.status !== 'ok') {
    throw new Error('AI exhausted generating UI registry');
  }

  return result.text;
}
```

### API Route Extension

**Add new context file types:**

```typescript
// app/api/context-files/[projectId]/generate/route.ts

case 'UI_TOKENS': {
  const content = await generateUITokens(project.id, user.plan);
  // ... upsert logic
  break;
}

case 'UI_RULES': {
  const content = await generateUIRules(project.id, user.plan);
  // ... upsert logic
  break;
}

case 'UI_REGISTRY': {
  const content = await generateUIRegistry(project.id, user.plan);
  // ... upsert logic
  break;
}
```

### Database Schema

**Verify ContextFileType enum:**

```prisma
enum ContextFileType {
  PROJECT_OVERVIEW
  ARCHITECTURE_CONTEXT
  CODE_STANDARDS
  UI_CONTEXT           // DEPRECATED - split into 3 below
  UI_TOKENS            // NEW
  UI_RULES             // NEW
  UI_REGISTRY          // NEW
  AI_WORKFLOW_RULES
  PROGRESS_TRACKER
}
```

**Migration needed:** Add UI_TOKENS, UI_RULES, UI_REGISTRY to enum if not present.

### ZIP Export Update

**Include all 3 UI context files:**

```typescript
// lib/zip/build-project-zip.ts

const uiContextFiles = await prisma.contextFile.findMany({
  where: {
    projectId,
    fileType: { in: ['UI_TOKENS', 'UI_RULES', 'UI_REGISTRY'] },
  },
});

for (const file of uiContextFiles) {
  const fileName = file.fileType === 'UI_TOKENS' ? 'ui-tokens.md' :
                   file.fileType === 'UI_RULES' ? 'ui-rules.md' :
                   'ui-registry.md';
  
  zip.file(`context/${fileName}`, file.content);
}
```

### Reading Order in AGENTS.md

**Update mandatory reading order:**

```markdown
## Mandatory Reading Order

1. ARTKINS_STYLE_GUIDE.md
2. research/PROJECT_RESEARCH.md
3. Diagrams (System Context, Container, ERD, etc.)
4. context/project-overview.md
5. context/architecture-context.md
6. context/build-plan.md
7. context/code-standards.md
8. context/library-docs.md
9. context/ui-tokens.md       ← Read first (tokens)
10. context/ui-rules.md       ← Then rules
11. context/ui-registry.md    ← Then component catalog
12. context/ai-workflow-rules.md
13. context/progress-tracker.md
```

## Out of Scope

- Splitting other context files (architecture-context remains single file)
- Automatic UI token extraction from Figma/design tools
- Component library generation (only documentation, not actual components)

## Future Modifications

- Future features may add Figma plugin to extract tokens directly
- Future features may generate actual component code from ui-registry.md
- Future features may add visual component preview in exported docs

## Quality Gates

- Run `npm run test` and ensure it passes (minimum 9 new tests: 3 prompts, 3 generators, 3 API routes)
- Run `npm run build` and ensure it passes
- Run `npm run security:all` and ensure it passes before push
- Verify ContextFileType enum includes all 3 new types
- Test generation with various project types (web, mobile, backend)

## Acceptance Criteria

- [ ] ContextFileType enum includes UI_TOKENS, UI_RULES, UI_REGISTRY
- [ ] getUITokensPrompt() returns comprehensive system prompt with structure and rules
- [ ] getUIRulesPrompt() returns prompt adapted to project type and platform
- [ ] getUIRegistryPrompt() returns prompt focusing on needed components only
- [ ] generateUITokens() fetches visual research and generates tokens based on branding
- [ ] generateUIRules() adapts patterns to project type (web app, mobile, e-commerce, etc.)
- [ ] generateUIRegistry() catalogs only components needed for project features
- [ ] API route handles UI_TOKENS, UI_RULES, UI_REGISTRY cases
- [ ] Each file independently useful (no mandatory cross-references for basic usage)
- [ ] Generated ui-tokens.md never defaults to Lynx Theme Pro unless user chose it
- [ ] Generated ui-rules.md includes WCAG 2.1 AA accessibility standards
- [ ] Generated ui-registry.md includes component decision tree
- [ ] ZIP export includes all 3 UI context files in /context folder
- [ ] AGENTS.md reading order lists ui-tokens before ui-rules before ui-registry
- [ ] Non-owner access returns 404 (owner-only generation)
- [ ] `context/progress-tracker.md` updated to mark feature DONE
- [ ] `npm run build` passes with no warnings
- [ ] CodeRabbit review completed (recommended quality gate)