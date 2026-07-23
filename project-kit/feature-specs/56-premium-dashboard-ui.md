# Feature 56 - Premium Dashboard UI Redesign

## Type

MODIFICATION (modifies Feature 06 - Layout Shell)

## What This Delivers

Premium dashboard redesign with Lynx Theme Pro dark aesthetic, GSAP-powered animations, glass morphism cards, magnetic button interactions, scroll-triggered reveals, and responsive grid layout. Transforms the existing dashboard from basic project cards to an award-winning, motion-rich interface matching Kargul Studios design standards.

## Dependencies

- Feature 06 (Layout Shell) must be complete for the dashboard foundation.
- Feature 04 (Project CRUD) provides the project data.
- Feature 01 (Design System) provides base shadcn components.
- Feature 39 (Shared Projects Dashboard) provides owned/shared project separation.

## Context To Read First

- `context/ui-tokens.md` (Lynx Theme Pro color palette, shadows, glass morphism)
- `context/ui-rules.md` (Animation rules, GSAP patterns, responsive design)
- `context/ui-registry.md` (ProjectCard, EmptyState, NewProjectButton components)
- `context/library-docs.md` (GSAP integration patterns)
- `ARTKINS_STYLE_GUIDE.md` (Section 4A: Premium UI Standards)
- `context/build-plan.md` (Phase 6: Premium Dashboard UI Redesign)
- `context/progress-tracker.md`

## Context7 Docs To Check

- GSAP ScrollTrigger for scroll-triggered animations
- GSAP React hooks (`useGSAP`) for proper cleanup

```bash
npx ctx7 library gsap "ScrollTrigger stagger animations with React"
npx ctx7 library @gsap/react "useGSAP hook cleanup patterns"
```

## Files Owned

- `app/(app)/dashboard/page.tsx` (complete redesign)
- `components/dashboard/ProjectCard.tsx` (enhanced with animations)
- `components/dashboard/NewProjectButton.tsx` (magnetic interaction)
- `components/dashboard/EmptyState.tsx` (fade-in animation)
- `components/dashboard/DashboardGrid.tsx`
- `components/dashboard/SectionHeader.tsx`
- `lib/animations/dashboard.ts`
- `lib/animations/magnetic.ts`

## Files

MODIFY: `app/(app)/dashboard/page.tsx` - rebuild with premium layout, GSAP animations
MODIFY: `components/dashboard/ProjectCard.tsx` - add glass morphism, hover lift, status glow
MODIFY: `components/dashboard/NewProjectButton.tsx` - add magnetic hover effect
MODIFY: `components/dashboard/EmptyState.tsx` - add fade-in animation
CREATE: `components/dashboard/DashboardGrid.tsx` - animated grid container
CREATE: `components/dashboard/SectionHeader.tsx` - section title with underline animation
CREATE: `lib/animations/dashboard.ts` - GSAP animation helpers
CREATE: `lib/animations/magnetic.ts` - reusable magnetic button logic
MODIFY: `context/progress-tracker.md` - mark feature progress

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract (schema fields or relations, route signatures, helper signatures, AI task names or callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, or file ownership), update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch. Do not leave future specs with stale names, old API shapes, or invalid fields.



- **CRITICAL**: GSAP 3.12+ and `@gsap/react` must already be installed from Feature 01. If not, install exact-pinned versions.
- **CRITICAL**: Register GSAP plugins in `lib/gsap-config.ts` before use: `gsap.registerPlugin(ScrollTrigger, useGSAP)`.
- **CRITICAL**: Ensure all animations run at 60fps with no layout shift (CLS < 0.1 per `ui-rules.md`).
- **CRITICAL**: Follow `ui-rules.md` animation rules: < 500ms duration, purposeful motion, GSAP for complex interactions.

### Dashboard Layout

**Structure:**
```tsx
<div className="min-h-screen bg-background">
  {/* Hero Section */}
  <section className="px-6 py-12">
    <h1 className="text-5xl font-black text-primary">Your Projects</h1>
    <p className="text-lg text-secondary mt-2">Build the future, one project at a time.</p>
  </section>

  {/* My Projects Section */}
  <section className="px-6 py-8">
    <SectionHeader title="My Projects" count={ownedProjects.length} />
    <DashboardGrid projects={ownedProjects} />
  </section>

  {/* Shared With Me Section */}
  {sharedProjects.length > 0 && (
    <section className="px-6 py-8">
      <SectionHeader title="Shared With Me" count={sharedProjects.length} />
      <DashboardGrid projects={sharedProjects} />
    </section>
  )}

  {/* Floating New Project Button */}
  <NewProjectButton />
</div>
```

### ProjectCard Component (Enhanced)

**Glass Morphism:**
```tsx
<div className="glass-medium rounded-lg p-6 transition-all duration-300 hover:shadow-high">
  {/* Card content */}
</div>
```

**CSS (applied via Tailwind or inline):**
```css
.glass-medium {
  background: rgba(26, 26, 26, 0.7);
  backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.1);
}
```

**Hover Lift Animation (GSAP):**
```typescript
'use client';

import { useRef } from 'react';
import { gsap } from '@/lib/gsap-config';

export function ProjectCard({ project }: { project: Project }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    gsap.to(cardRef.current, {
      y: -4,
      duration: 0.2,
      ease: 'power2.out',
    });
  };

  const handleMouseLeave = () => {
    gsap.to(cardRef.current, {
      y: 0,
      duration: 0.2,
      ease: 'power2.out',
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="glass-medium rounded-lg p-6 transition-shadow duration-300 hover:shadow-high"
    >
      {/* Status badge with glow */}
      <div className={`status-badge ${project.status === 'COMPLETED' ? 'glow-primary' : ''}`}>
        {project.status}
      </div>

      {/* Project content */}
      <h3 className="text-xl font-semibold text-primary">{project.name}</h3>
      <p className="text-sm text-secondary mt-2">{project.description}</p>

      {/* Metadata */}
      <div className="flex gap-4 mt-4 text-xs text-muted">
        <span>{project.featureSpecCount} specs</span>
        <span>{project.completedDiagramCount} diagrams</span>
        <span>{formatDate(project.updatedAt)}</span>
      </div>
    </div>
  );
}
```

**Status Badge Glow (for completed projects):**
```css
.glow-primary {
  box-shadow: 0 0 20px rgba(0, 230, 118, 0.4), 0 0 40px rgba(0, 230, 118, 0.2);
}
```

### Magnetic Button Interaction

**NewProjectButton with magnetic effect:**
```typescript
'use client';

import { useRef } from 'react';
import { gsap } from '@/lib/gsap-config';
import { Plus } from 'lucide-react';

export function NewProjectButton() {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    gsap.to(buttonRef.current, {
      x: x * 0.3,
      y: y * 0.3,
      duration: 0.3,
      ease: 'power2.out',
    });
  };

  const handleMouseLeave = () => {
    gsap.to(buttonRef.current, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: 'elastic.out(1, 0.5)',
    });
  };

  const handleClick = () => {
    // Scale animation on click
    gsap.timeline()
      .to(buttonRef.current, { scale: 0.95, duration: 0.1 })
      .to(buttonRef.current, { scale: 1, duration: 0.2, ease: 'back.out(1.7)' });
  };

  return (
    <button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className="fixed bottom-8 right-8 w-16 h-16 bg-primary rounded-full shadow-high hover:shadow-glowPrimary transition-shadow flex items-center justify-center"
    >
      <Plus className="h-8 w-8 text-background" />
    </button>
  );
}
```

### Scroll-Triggered Stagger Reveal

**DashboardGrid with scroll animation:**
```typescript
'use client';

import { useRef } from 'react';
import { useGSAP } from '@/lib/gsap-config';
import { gsap } from 'gsap';
import { ProjectCard } from './ProjectCard';

export function DashboardGrid({ projects }: { projects: Project[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from('.project-card', {
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play none none reverse',
      },
      y: 60,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15, // 150ms delay between each card
      ease: 'power3.out',
    });
  }, { scope: containerRef });

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {projects.map((project) => (
        <div key={project.id} className="project-card">
          <ProjectCard project={project} />
        </div>
      ))}
    </div>
  );
}
```

### SectionHeader with Underline Animation

**Animated section headers:**
```typescript
'use client';

import { useRef } from 'react';
import { useGSAP } from '@/lib/gsap-config';
import { gsap } from 'gsap';

export function SectionHeader({ title, count }: { title: string; count: number }) {
  const underlineRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(underlineRef.current, {
      scrollTrigger: {
        trigger: underlineRef.current,
        start: 'top 90%',
      },
      scaleX: 0,
      duration: 0.6,
      ease: 'power2.out',
    });
  }, { scope: underlineRef });

  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-primary inline-block">
        {title} <span className="text-secondary text-lg">({count})</span>
      </h2>
      <div
        ref={underlineRef}
        className="h-1 w-24 bg-primary mt-2 origin-left"
      />
    </div>
  );
}
```

### EmptyState Animation

**Fade-in empty state:**
```typescript
'use client';

import { useRef } from 'react';
import { useGSAP } from '@/lib/gsap-config';
import { gsap } from 'gsap';
import { FolderOpen } from 'lucide-react';

export function EmptyState({ onCreateProject }: { onCreateProject: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(containerRef.current, {
      opacity: 0,
      y: 30,
      duration: 0.8,
      ease: 'power3.out',
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center h-96 text-center">
      <FolderOpen className="h-16 w-16 text-muted mb-4" />
      <h3 className="text-xl font-semibold mb-2 text-primary">No projects yet</h3>
      <p className="text-secondary mb-6 max-w-md">
        Get started by creating your first project. Foundrie will guide you through
        the discovery process step by step.
      </p>
      <button
        onClick={onCreateProject}
        className="px-6 py-3 bg-primary text-background rounded-lg font-semibold hover:shadow-glowPrimary transition-shadow"
      >
        <Plus className="inline-block mr-2 h-5 w-5" />
        New Project
      </button>
    </div>
  );
}
```

### Responsive Design

**Grid breakpoints:**
- Mobile (< 768px): 1 column
- Tablet (768px - 1024px): 2 columns
- Desktop (≥ 1024px): 3 columns

**Touch-friendly:**
- All buttons min 44×44px hit targets
- Magnetic effect disabled on touch devices (check `window.matchMedia('(pointer: fine)')`)
- Hover states replaced with active states on mobile

### Performance Optimizations

1. **Image Lazy Loading**: Use Next.js `<Image>` component for project thumbnails (if added in future)
2. **Virtual Scrolling**: Not needed for dashboard (typically < 50 projects per user)
3. **Animation Frame Rate**: GSAP animations target 60fps automatically
4. **Layout Shift Prevention**: Reserve space for cards during loading (skeleton loaders)

### Skeleton Loaders

**Loading state during initial fetch:**
```tsx
{isLoading ? (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="glass-medium rounded-lg p-6 h-48">
        <Skeleton className="h-6 w-3/4 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    ))}
  </div>
) : (
  <DashboardGrid projects={projects} />
)}
```

## Out of Scope

- Project thumbnails (deferred to future feature)
- Dashboard analytics/metrics (project counts, activity graphs)
- Custom dashboard layouts (user-configurable grid sizes)
- Drag-and-drop project reordering

## Future Modifications

- Future features may add project thumbnails (generated from diagrams or user uploads)
- Future features may add dashboard metrics visualization (charts, activity timeline)
- Future features may add custom themes (allow users to switch color palettes)

## Quality Gates

- Run `npm run test` and ensure it passes (minimum 12 new tests: 4 ProjectCard, 3 magnetic button, 2 scroll animations, 3 responsive layout)
- Run `npm run build` and ensure it passes
- Run `npm run security:all` and ensure it passes before push
- Visual regression testing: Compare before/after screenshots
- Performance testing: Lighthouse score ≥ 90, no animation frame drops

## Acceptance Criteria

- [ ] Dashboard displays projects in responsive grid (1-2-3 columns)
- [ ] Project cards use glass morphism with `backdrop-filter: blur(12px)`
- [ ] Project cards lift 4px on hover with smooth animation (200ms)
- [ ] Completed projects have green glow effect on status badge
- [ ] New Project button has magnetic hover effect (follows cursor within bounds)
- [ ] New Project button has elastic reset animation on mouse leave
- [ ] New Project button has scale animation on click (0.95 → 1 with back.out easing)
- [ ] Project cards stagger-reveal on scroll with 150ms delay between each
- [ ] Section headers have underline animation on scroll into view
- [ ] Empty state fades in with 800ms duration
- [ ] All animations run at 60fps with no dropped frames
- [ ] Magnetic effect disabled on touch devices
- [ ] Mobile layout uses 1 column, tablet 2 columns, desktop 3 columns
- [ ] All interactive elements have min 44×44px touch targets
- [ ] Skeleton loaders shown during initial data fetch
- [ ] GSAP ScrollTrigger properly registered and configured
- [ ] No layout shift during animations (CLS < 0.1)
- [ ] Accessibility: Keyboard navigation, focus indicators, ARIA labels
- [ ] `context/progress-tracker.md` updated to mark feature DONE
- [ ] `npm run build` passes with no warnings
- [ ] CodeRabbit review completed (recommended quality gate)