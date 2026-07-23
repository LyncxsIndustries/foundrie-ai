# Feature 57 - Dynamic Project Templates System

## Type

NEW FEATURE

## What This Delivers

Project template library with 9+ pre-configured templates (3 SIMPLE, 3 STANDARD, 3 COMPLEX) that adapt discovery phase flow, diagram requirements, and context file generation based on project type. Users select templates during project creation, pre-filling project context, setting complexity classification, and guiding AI through appropriate phase sequences. Templates include example tech stacks, sample phases, diagram thumbnails, and starter prompts.

## Dependencies

- Feature 53 (Dynamic Phase Completion Detection) must be complete for complexity classification.
- Feature 04 (Project CRUD) provides project creation infrastructure.
- Feature 10 (Discovery Chat) provides the chat interface for template-driven discovery.
- Feature 43 (Marketing & Onboarding Surface) provides the new project form.

## Context To Read First

- `context/ai-workflow-rules.md` (Semantic Phase Detection Rules section)
- `context/build-plan.md` (Phase 7: Dynamic Project Templates System)
- `context/ui-registry.md` (Template selector components)
- `context/progress-tracker.md`

## Context7 Docs To Check

- React Hook Form for template selection form
- Zod for template validation schemas

```bash
npx ctx7 library react-hook-form "Nested form fields with dynamic arrays"
npx ctx7 library zod "Union types for template variants"
```

## Files Owned

- `lib/templates/definitions.ts`
- `lib/templates/apply-template.ts`
- `lib/templates/simple-templates.ts`
- `lib/templates/standard-templates.ts`
- `lib/templates/complex-templates.ts`
- `components/projects/TemplateSelector.tsx`
- `components/projects/TemplatePreviewCard.tsx`
- `components/projects/TemplateGrid.tsx`
- `app/(app)/projects/new/page.tsx` (modified)

## Files

CREATE: `lib/templates/definitions.ts` - core template types and validation
CREATE: `lib/templates/apply-template.ts` - logic to apply template to new project
CREATE: `lib/templates/simple-templates.ts` - 3 SIMPLE project templates
CREATE: `lib/templates/standard-templates.ts` - 3 STANDARD project templates
CREATE: `lib/templates/complex-templates.ts` - 3 COMPLEX project templates
CREATE: `components/projects/TemplateSelector.tsx` - main template selection UI
CREATE: `components/projects/TemplatePreviewCard.tsx` - individual template card with preview
CREATE: `components/projects/TemplateGrid.tsx` - grid layout for template cards
MODIFY: `app/(app)/projects/new/page.tsx` - integrate template selector
MODIFY: `app/api/projects/route.ts` - accept `templateId` in POST body
MODIFY: `lib/ai/prompts/discovery.ts` - adapt system prompt based on template
MODIFY: `context/progress-tracker.md` - mark feature progress

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract (schema fields or relations, route signatures, helper signatures, AI task names or callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, or file ownership), update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch. Do not leave future specs with stale names, old API shapes, or invalid fields.

- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: Template definitions must be version-controlled and immutable once in use (add new templates, don't modify existing).
- **CRITICAL**: Ensure template tech stacks are **suggestions only**, not locked decisions. Users can deviate during discovery.

### Template Data Structure

**Core Types:**

```typescript
// lib/templates/definitions.ts

export type ProjectComplexity = 'SIMPLE' | 'STANDARD' | 'COMPLEX';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  complexity: ProjectComplexity;
  category: 'Web' | 'Mobile' | 'Desktop' | 'Backend' | 'AI/ML';
  icon: LucideIcon;
  
  // Pre-fill data
  defaultName: string;
  defaultDescription: string;
  
  // Discovery guidance
  samplePhases: string[]; // ["Problem & Users", "Core Flows", "Architecture"]
  starterPrompt: string; // Initial AI message
  suggestedQuestions: string[]; // Questions AI should ask
  
  // Tech stack suggestions
  suggestedStack: {
    frontend?: string[];
    backend?: string[];
    database?: string[];
    deployment?: string[];
  };
  
  // Diagram hints
  requiredDiagrams: DiagramType[];
  optionalDiagrams: DiagramType[];
  
  // Visual preview
  thumbnailUrl?: string; // Example diagram or UI screenshot
  exampleProjects?: string[]; // "Vercel.com", "Linear.app"
}

export const TEMPLATE_CATEGORIES = [
  'Web',
  'Mobile',
  'Desktop',
  'Backend',
  'AI/ML',
] as const;
```

### Template Definitions

**SIMPLE Templates (3):**

1. **Portfolio Site**
```typescript
{
  id: 'simple-portfolio',
  name: 'Portfolio Site',
  description: 'Personal portfolio with projects, about, and contact sections',
  complexity: 'SIMPLE',
  category: 'Web',
  icon: User,
  defaultName: 'My Portfolio',
  defaultDescription: 'A dark-themed portfolio site showcasing my work',
  samplePhases: ['Problem & Users', 'Core Flows', 'Architecture', 'ZIP Export'],
  starterPrompt: "I see you're building a portfolio site! Let's start with the basics. Who is your target audience, and what's the main action you want visitors to take?",
  suggestedQuestions: [
    'What projects do you want to showcase?',
    'Do you need a blog section?',
    'Any specific design inspiration?',
  ],
  suggestedStack: {
    frontend: ['Next.js', 'Tailwind CSS', 'Framer Motion'],
    deployment: ['Vercel', 'Netlify'],
  },
  requiredDiagrams: ['system-context', 'container'],
  optionalDiagrams: ['dfd'],
  exampleProjects: ['leerob.io', 'jahir.dev'],
}
```

2. **Landing Page**
3. **Product Showcase**

**STANDARD Templates (3):**

1. **SaaS Dashboard**
```typescript
{
  id: 'standard-saas-dashboard',
  name: 'SaaS Dashboard',
  description: 'Full-stack SaaS app with auth, database, and API',
  complexity: 'STANDARD',
  category: 'Web',
  icon: LayoutDashboard,
  defaultName: 'SaaS App',
  defaultDescription: 'A dashboard application for [specific use case]',
  samplePhases: [
    'Problem & Users',
    'Core Flows',
    'Scope & Constraints',
    'Technical Direction',
    'Architecture',
    'Feature Specs',
    'ZIP Export'
  ],
  starterPrompt: "Let's build your SaaS dashboard! Tell me about the problem you're solving and who your users are.",
  suggestedQuestions: [
    'What metrics or data will users view?',
    'Do you need team/organization features?',
    'What integrations are critical (Stripe, Slack, etc.)?',
    'Any specific performance requirements?',
  ],
  suggestedStack: {
    frontend: ['Next.js', 'React', 'TanStack Query', 'shadcn/ui'],
    backend: ['Next.js API Routes', 'Node.js'],
    database: ['PostgreSQL (Neon)', 'Prisma'],
    deployment: ['Vercel'],
  },
  requiredDiagrams: ['system-context', 'container', 'erd', 'sequence', 'feature-dag'],
  optionalDiagrams: ['component', 'deployment', 'api-map'],
  exampleProjects: ['Linear', 'Cal.com', 'Vercel Dashboard'],
}
```

2. **E-commerce Store**
3. **Content Platform (Blog/CMS)**

**COMPLEX Templates (3):**

1. **Real-time Collaboration Platform**
```typescript
{
  id: 'complex-realtime-collab',
  name: 'Real-time Collaboration Platform',
  description: 'Multi-tenant platform with live collaboration, conflict resolution, and presence',
  complexity: 'COMPLEX',
  category: 'Web',
  icon: Users,
  defaultName: 'Collaboration Platform',
  defaultDescription: 'A real-time collaboration tool for [specific use case]',
  samplePhases: [
    'Problem & Users',
    'Core Flows',
    'Scope & Constraints',
    'Technical Direction',
    'Feature Sequence',
    'Architecture',
    'Feature Specs',
    'ZIP Export'
  ],
  starterPrompt: "Real-time collaboration is complex! Let's carefully map out your requirements. Start by telling me about the collaboration scenarios and conflict resolution needs.",
  suggestedQuestions: [
    'How many concurrent users per workspace?',
    'What happens when two users edit the same data?',
    'Do you need offline support?',
    'What's your scaling strategy (vertical vs horizontal)?',
    'Any regulatory/compliance requirements (GDPR, HIPAA)?',
  ],
  suggestedStack: {
    frontend: ['Next.js', 'React', 'Liveblocks', 'Yjs'],
    backend: ['Next.js API Routes', 'WebSocket server', 'Redis'],
    database: ['PostgreSQL (Neon)', 'Redis (caching + pub/sub)'],
    deployment: ['Vercel (frontend)', 'AWS ECS (WebSocket)'],
  },
  requiredDiagrams: [
    'system-context',
    'container',
    'component',
    'erd',
    'sequence',
    'dfd',
    'deployment',
    'feature-dag',
    'security-architecture'
  ],
  optionalDiagrams: ['state-machine', 'api-map', 'agent-architecture'],
  exampleProjects: ['Figma', 'Notion', 'Miro'],
}
```

2. **Multi-tenant Enterprise Platform**
3. **AI-Powered Application**

### Template Application Logic

**Apply template to project:**

```typescript
// lib/templates/apply-template.ts

import { prisma } from '@/lib/db';
import { getTemplateById } from './definitions';

export async function applyTemplate(
  projectId: string,
  templateId: string,
  userId: string
): Promise<void> {
  const template = getTemplateById(templateId);
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  // Update project with template metadata
  await prisma.project.update({
    where: { id: projectId },
    data: {
      templateId: template.id,
      complexity: template.complexity,
      // Note: name and description already set during creation
    },
  });

  // Create initial conversation message with template starter prompt
  await prisma.conversation.create({
    data: {
      projectId,
      role: 'assistant',
      content: template.starterPrompt,
      metadata: {
        templateId: template.id,
        suggestedQuestions: template.suggestedQuestions,
      },
    },
  });
}
```

### Template Selector UI

**TemplateSelector Component:**

```typescript
'use client';

import { useState } from 'react';
import { TemplateGrid } from './TemplateGrid';
import { SIMPLE_TEMPLATES, STANDARD_TEMPLATES, COMPLEX_TEMPLATES } from '@/lib/templates';

export function TemplateSelector({ onSelect }: { onSelect: (templateId: string) => void }) {
  const [selectedCategory, setSelectedCategory] = useState<'SIMPLE' | 'STANDARD' | 'COMPLEX' | 'ALL'>('ALL');

  const templates = {
    SIMPLE: SIMPLE_TEMPLATES,
    STANDARD: STANDARD_TEMPLATES,
    COMPLEX: COMPLEX_TEMPLATES,
  };

  const filteredTemplates = selectedCategory === 'ALL'
    ? [...SIMPLE_TEMPLATES, ...STANDARD_TEMPLATES, ...COMPLEX_TEMPLATES]
    : templates[selectedCategory];

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-4 py-2 rounded-lg ${selectedCategory === 'ALL' ? 'bg-primary text-background' : 'bg-surface text-secondary'}`}
        >
          All Templates
        </button>
        <button
          onClick={() => setSelectedCategory('SIMPLE')}
          className={`px-4 py-2 rounded-lg ${selectedCategory === 'SIMPLE' ? 'bg-primary text-background' : 'bg-surface text-secondary'}`}
        >
          Simple (3-4 phases)
        </button>
        <button
          onClick={() => setSelectedCategory('STANDARD')}
          className={`px-4 py-2 rounded-lg ${selectedCategory === 'STANDARD' ? 'bg-primary text-background' : 'bg-surface text-secondary'}`}
        >
          Standard (6-7 phases)
        </button>
        <button
          onClick={() => setSelectedCategory('COMPLEX')}
          className={`px-4 py-2 rounded-lg ${selectedCategory === 'COMPLEX' ? 'bg-primary text-background' : 'bg-surface text-secondary'}`}
        >
          Complex (8+ phases)
        </button>
      </div>

      {/* Template Grid */}
      <TemplateGrid templates={filteredTemplates} onSelect={onSelect} />

      {/* Start from Scratch Option */}
      <button
        onClick={() => onSelect('scratch')}
        className="w-full py-4 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors"
      >
        <span className="text-lg font-semibold text-primary">Start from Scratch</span>
        <p className="text-sm text-secondary mt-1">No template, full manual discovery</p>
      </button>
    </div>
  );
}
```

**TemplatePreviewCard:**

```typescript
export function TemplatePreviewCard({ template, onSelect }: { template: ProjectTemplate; onSelect: () => void }) {
  return (
    <div className="glass-medium rounded-lg p-6 hover:shadow-high transition-shadow cursor-pointer" onClick={onSelect}>
      {/* Icon */}
      <template.icon className="h-12 w-12 text-primary mb-4" />

      {/* Name & Description */}
      <h3 className="text-xl font-semibold text-primary">{template.name}</h3>
      <p className="text-sm text-secondary mt-2">{template.description}</p>

      {/* Complexity Badge */}
      <div className="mt-4 inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
        {template.complexity} • {template.samplePhases.length} phases
      </div>

      {/* Suggested Stack */}
      <div className="mt-4">
        <p className="text-xs text-muted mb-2">Suggested Tech:</p>
        <div className="flex flex-wrap gap-1">
          {template.suggestedStack.frontend?.slice(0, 3).map((tech) => (
            <span key={tech} className="px-2 py-1 bg-surface text-secondary text-xs rounded">
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Example Projects */}
      {template.exampleProjects && (
        <div className="mt-4 text-xs text-muted">
          Examples: {template.exampleProjects.join(', ')}
        </div>
      )}
    </div>
  );
}
```

### Database Schema Addition

**Add `templateId` and `complexity` to Project model:**

```prisma
model Project {
  // ... existing fields ...
  
  templateId  String?           // Template used (if any)
  complexity  ProjectComplexity? // SIMPLE, STANDARD, COMPLEX
  
  @@index([templateId])
}

enum ProjectComplexity {
  SIMPLE
  STANDARD
  COMPLEX
}
```

**Migration needed:**
- Add `templateId` field (nullable String)
- Add `complexity` field (nullable enum)
- Add index on `templateId`

### Project Creation Flow

**Updated `/app/(app)/projects/new/page.tsx`:**

1. User selects template or "Start from Scratch"
2. If template selected, pre-fill name and description
3. User can edit pre-filled values
4. On submit, POST to `/api/projects` with `templateId`
5. Backend applies template via `applyTemplate()`
6. Redirect to discovery chat with template starter prompt

## Out of Scope

- User-created custom templates (admin-only templates for now)
- Template marketplace or community sharing
- Template versioning (templates are immutable once defined)
- A/B testing different templates

## Future Modifications

- Future features may allow users to save their projects as custom templates
- Future features may add template analytics (success rates, completion times)
- Future features may suggest templates based on user's project description analysis

## Quality Gates

- Run `npm run test` and ensure it passes (minimum 10 new tests: 3 template definitions, 3 apply logic, 4 UI components)
- Run `npm run build` and ensure it passes
- Run `npm run security:all` and ensure it passes before push
- Test each template end-to-end (create project, verify phase flow, check diagram generation)

## Acceptance Criteria

- [ ] 9+ templates defined (3 SIMPLE, 3 STANDARD, 3 COMPLEX)
- [ ] Each template has name, description, complexity, category, icon
- [ ] Each template has defaultName, defaultDescription, samplePhases, starterPrompt
- [ ] Each template has suggestedStack, requiredDiagrams, optionalDiagrams
- [ ] TemplateSelector displays all templates in grid layout
- [ ] Category filter works (ALL, SIMPLE, STANDARD, COMPLEX)
- [ ] TemplatePreviewCard shows icon, name, description, complexity badge, tech stack
- [ ] User can select template or "Start from Scratch"
- [ ] Selected template pre-fills project name and description
- [ ] Project created with `templateId` and `complexity` saved to database
- [ ] Initial conversation message includes template `starterPrompt`
- [ ] Discovery AI adapts phase flow based on project complexity
- [ ] Template tech stacks are suggestions only (users can deviate)
- [ ] Responsive design (1 col mobile, 2 col tablet, 3 col desktop)
- [ ] Accessibility: Keyboard navigation, focus indicators, ARIA labels
- [ ] `context/progress-tracker.md` updated to mark feature DONE
- [ ] `npm run build` passes with no warnings
- [ ] CodeRabbit review completed (recommended quality gate)