# Feature 62 - Master Prompt Generation

## Type

NEW FEATURE

## What This Delivers

Master prompt generator for frontend/UI-focused projects that aggregates all feature specs, design tokens, component patterns, and implementation order into a single comprehensive prompt file. Enables "one-command project recreation" similar to motionsites.ai. Generated master prompts stored in `/prompts/master-prompt.md` within the ZIP export, allowing developers or AI agents to recreate the entire project in one session without reading dozens of separate files.

## Dependencies

- Feature 60 (UI Context Split) provides ui-tokens.md, ui-rules.md, ui-registry.md.
- Feature 26 (Feature Specs Generation) provides ordered feature specs.
- Feature 20 (Diagram Storage) provides diagram exports.
- Feature 55 (Research Phase Media Management) provides Cloudinary asset URLs.

## Context To Read First

- `ARTKINS_STYLE_GUIDE.md` (Section 4A: Motion-Sites Style Master Prompts)
- `context/build-plan.md` (Phase 11: Master Prompt Generation)
- `context/progress-tracker.md`

## Context7 Docs To Check

- No external libraries needed (prompt aggregation only)

## Files Owned

- `lib/generation/master-prompt.ts`
- `lib/ai/prompts/master-prompt.ts`
- `app/api/prompts/[projectId]/generate/route.ts`

## Files

CREATE: `lib/generation/master-prompt.ts` - aggregate all context into master prompt
CREATE: `lib/ai/prompts/master-prompt.ts` - system prompt for master prompt generation
CREATE: `app/api/prompts/[projectId]/generate/route.ts` - master prompt generation endpoint
MODIFY: `lib/zip/build-project-zip.ts` - include /prompts/master-prompt.md in ZIP
MODIFY: `context/progress-tracker.md` - mark feature progress

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract (schema fields or relations, route signatures, helper signatures, AI task names or callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, or file ownership), update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch. Do not leave future specs with stale names, old API shapes, or invalid fields.

- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: Only generate master prompts for SIMPLE and STANDARD frontend-focused projects (detect from architecture).
- **CRITICAL**: Master prompt must be self-contained (no external file references except Cloudinary URLs).
- **CRITICAL**: Include explicit implementation order (step-by-step build sequence).

### Project Type Detection

**Determine if project qualifies for master prompt:**

```typescript
// lib/generation/master-prompt.ts

function shouldGenerateMasterPrompt(project: Project, architecture: string): boolean {
  // Only SIMPLE and STANDARD projects
  if (project.complexity === 'COMPLEX') return false;

  // Only frontend-focused projects
  const frontendPatterns = [
    /landing page/i,
    /portfolio/i,
    /marketing site/i,
    /dashboard/i,
    /web app/i,
    /next\.js/i,
    /react/i,
  ];

  const backendPatterns = [
    /microservice/i,
    /api gateway/i,
    /backend service/i,
    /graphql server/i,
  ];

  const hasFrontend = frontendPatterns.some(p => p.test(architecture));
  const isBackendOnly = backendPatterns.some(p => p.test(architecture)) && !hasFrontend;

  return hasFrontend && !isBackendOnly;
}
```

### Master Prompt Structure

**Comprehensive prompt format:**

```markdown
# Master Prompt: [Project Name]

You are a Principal Creative Technologist with expertise in [primary tech stack]. Build this project from scratch following these specifications exactly.

## Objective

[Complete project description from requirements]

## Tech Stack

### Core Technologies
- **Framework:** [Next.js 15.0.3, React 19, etc.]
- **Styling:** [Tailwind CSS 4.0, CSS-in-JS, etc.]
- **State Management:** [Zustand, Context, Redux, etc.]
- **Animation:** [GSAP 3.12, Framer Motion, etc.]

### Dependencies (Exact Versions)
```json
{
  "next": "15.0.3",
  "react": "19.0.0",
  "tailwind": "4.0.0",
  ...
}
```

## Design Tokens

### Color Palette
```typescript
export const colors = {
  primary: '#00e676',
  background: '#0f0f0f',
  ...
};
```

### Typography
- **Heading Font:** Inter, 900 weight
- **Body Font:** Inter, 400 weight
- **Scale:** 1.25 ratio (16px base)

### Spacing Scale
- Base unit: 4px
- Scale: 4, 8, 16, 24, 32, 48, 64, 96

## Components

### Button Component
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({ variant, size, children }: ButtonProps) {
  // Implementation
}
```

[Repeat for all components]

## Animations

### Scroll-Triggered Reveal
```typescript
gsap.from('.card', {
  scrollTrigger: {
    trigger: '.cards-container',
    start: 'top 80%',
  },
  y: 60,
  opacity: 0,
  duration: 0.8,
  stagger: 0.15,
});
```

[Include all key animations]

## Pages & Routes

### Home Page (\`/\`)
- Hero section with gradient background
- Features grid (3 columns)
- CTA section with magnetic button

### About Page (\`/about\`)
- Team member cards with hover effects
- Company timeline

[List all pages]

## Assets

### Images (Cloudinary URLs)
- Hero image: https://res.cloudinary.com/.../hero.jpg
- Logo: https://res.cloudinary.com/.../logo.svg

### Videos
- Demo video: https://res.cloudinary.com/.../demo.mp4

## Implementation Order

1. **Setup Project**
   ```bash
   npx create-next-app@15.0.3 project-name
   npm install tailwindcss gsap
   ```

2. **Configure Tailwind**
   - Create \`tailwind.config.ts\` with design tokens
   - Add globals.css with custom properties

3. **Build Design System**
   - Create \`components/ui/button.tsx\`
   - Create \`components/ui/card.tsx\`
   - [All primitive components]

4. **Build Layout**
   - Create \`app/layout.tsx\` with navigation
   - Create \`components/Header.tsx\`
   - Create \`components/Footer.tsx\`

5. **Build Pages**
   - Implement \`app/page.tsx\` (Home)
   - Implement \`app/about/page.tsx\`
   - [All pages in order]

6. **Add Animations**
   - Configure GSAP ScrollTrigger
   - Add scroll reveals
   - Add hover interactions

7. **Test & Deploy**
   - Run \`npm run build\`
   - Deploy to Vercel

## Critical Notes

- All colors use design tokens (no hardcoded hex values)
- All spacing uses 4px base unit
- All animations run at 60fps
- Touch targets minimum 44x44px
- WCAG AA color contrast (4.5:1 minimum)
```

### System Prompt

```typescript
// lib/ai/prompts/master-prompt.ts

export function getMasterPromptGenerationPrompt() {
  return `Generate a comprehensive master prompt that enables one-command project recreation.

STRUCTURE (follow exactly):
1. **Objective** - Complete project description and goals
2. **Tech Stack** - Core technologies with exact versions
3. **Design Tokens** - All colors, typography, spacing, shadows
4. **Components** - Every component with props and implementation
5. **Animations** - All GSAP/Framer Motion animations with exact timing/easing
6. **Pages & Routes** - Every page with layout and content structure
7. **Assets** - All media with Cloudinary URLs (no placeholders)
8. **Implementation Order** - Step-by-step build sequence

CRITICAL RULES:
- Include EXACT versions from package.json (never "latest")
- Provide complete component implementations (not just interfaces)
- Include all animation code with exact durations and easing
- Use Cloudinary URLs for all uploaded assets
- Specify implementation order from foundation → pages → animations
- Make prompt self-contained (readable without other files)
- Target audience: Senior developer or AI coding agent
- Assume reader has zero context about the project

TONE:
- Authoritative and precise
- Direct imperatives ("Create X", "Build Y")
- Technical but clear
- No fluff or filler

OUTPUT: Complete master prompt in markdown format (8000-12000 words).`;
}
```

### Generation Logic

```typescript
// lib/generation/master-prompt.ts

import { prisma } from '@/lib/db';
import { callAI } from '@/lib/ai';

export async function generateMasterPrompt(projectId: string, plan: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      requirements: true,
      executionPlans: {
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      featureSpecs: {
        orderBy: { order: 'asc' },
      },
      researchFiles: true,
    },
  });

  if (!project) throw new Error('Project not found');

  // Check if project qualifies
  const architecture = project.executionPlans[0]?.content || '';
  if (!shouldGenerateMasterPrompt(project, architecture)) {
    throw new Error('Master prompt only generated for SIMPLE/STANDARD frontend projects');
  }

  // Fetch context files
  const uiTokens = await prisma.contextFile.findFirst({
    where: { projectId, fileType: 'UI_TOKENS' },
    select: { content: true },
  });

  const uiRules = await prisma.contextFile.findFirst({
    where: { projectId, fileType: 'UI_RULES' },
    select: { content: true },
  });

  const uiRegistry = await prisma.contextFile.findFirst({
    where: { projectId, fileType: 'UI_REGISTRY' },
    select: { content: true },
  });

  const systemPrompt = getMasterPromptGenerationPrompt();
  const userPrompt = `Project: ${project.name}

Requirements:
${JSON.stringify(project.requirements?.content, null, 2)}

Architecture:
${architecture}

Design Tokens:
${uiTokens?.content || 'Not generated'}

UI Rules:
${uiRules?.content || 'Not generated'}

Component Registry:
${uiRegistry?.content || 'Not generated'}

Feature Specs:
${project.featureSpecs.map(s => `${s.title}\n${s.content}`).join('\n\n---\n\n')}

Media Assets (use Cloudinary URLs):
${project.researchFiles.map(f => `${f.fileName}: ${f.cloudinaryUrl}`).join('\n')}

Generate a comprehensive master prompt for one-command project recreation. Include exact versions, complete implementations, and step-by-step build sequence.`;

  const result = await callAI('master_prompt_generation', {
    systemPrompt,
    userPrompt,
    plan,
    maxTokens: 16000, // Large for comprehensive prompt
  });

  if (result.status !== 'ok') {
    throw new Error('AI exhausted generating master prompt');
  }

  return result.text;
}
```

### API Route

```typescript
// app/api/prompts/[projectId]/generate/route.ts

import { requireAuth, requireProjectOwner } from '@/lib/auth';
import { generateMasterPrompt } from '@/lib/generation/master-prompt';

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const user = await requireAuth(req);
    await requireProjectOwner(params.projectId, user.id);

    const masterPrompt = await generateMasterPrompt(params.projectId, user.plan);

    // Store in database for future reference
    await prisma.project.update({
      where: { id: params.projectId },
      data: { masterPrompt },
    });

    return Response.json({ masterPrompt });
  } catch (error) {
    if (error.message.includes('only generated for')) {
      return Response.json(
        { error: 'Master prompt only available for SIMPLE/STANDARD frontend projects' },
        { status: 400 }
      );
    }

    return Response.json({ error: 'Failed to generate master prompt' }, { status: 500 });
  }
}
```

### ZIP Export Integration

```typescript
// lib/zip/build-project-zip.ts

// Include master prompt if exists
if (project.masterPrompt) {
  zip.folder('prompts')!.file('master-prompt.md', project.masterPrompt);
}
```

### Database Schema

**Add masterPrompt field to Project:**

```prisma
model Project {
  // ... existing fields ...
  
  masterPrompt String? @db.Text // Generated master prompt (SIMPLE/STANDARD frontend only)
}
```

**Migration needed:** Add `masterPrompt` field (nullable Text).

## Out of Scope

- Master prompts for backend-only projects
- Master prompts for COMPLEX projects (too large, better use standard context files)
- Master prompt versioning (only latest version stored)
- Master prompt diffing (comparing versions)

## Future Modifications

- Future features may add master prompt for mobile projects (React Native, Flutter)
- Future features may add master prompt templates (users can customize format)
- Future features may add master prompt sharing (community prompt library)

## Quality Gates

- Run `npm run test` and ensure it passes (minimum 6 new tests: 2 detection logic, 1 generator, 3 API routes)
- Run `npm run build` and ensure it passes
- Run `npm run security:all` and ensure it passes before push
- Test with SIMPLE project (should generate)
- Test with STANDARD frontend project (should generate)
- Test with COMPLEX project (should NOT generate)
- Test with backend-only project (should NOT generate)

## Acceptance Criteria

- [ ] shouldGenerateMasterPrompt() returns true for SIMPLE frontend projects
- [ ] shouldGenerateMasterPrompt() returns true for STANDARD frontend projects
- [ ] shouldGenerateMasterPrompt() returns false for COMPLEX projects
- [ ] shouldGenerateMasterPrompt() returns false for backend-only projects
- [ ] getMasterPromptGenerationPrompt() returns comprehensive system prompt
- [ ] generateMasterPrompt() aggregates requirements, architecture, specs, assets
- [ ] Generated prompt includes exact library versions (no "latest")
- [ ] Generated prompt includes complete component implementations
- [ ] Generated prompt includes all animations with timing/easing
- [ ] Generated prompt includes Cloudinary URLs for all assets
- [ ] Generated prompt includes step-by-step implementation order
- [ ] Generated prompt is self-contained (no external references except URLs)
- [ ] API route returns 400 for non-qualifying projects with clear error message
- [ ] masterPrompt stored in Project model for future reference
- [ ] ZIP export includes /prompts/master-prompt.md if generated
- [ ] Non-owner access returns 404
- [ ] `context/progress-tracker.md` updated to mark feature DONE
- [ ] `npm run build` passes with no warnings
- [ ] CodeRabbit review completed (recommended quality gate)