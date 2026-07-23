# Feature 67 - Enhanced Project Overview with Friendly UI

## Type

ENHANCEMENT

## What This Delivers

Comprehensive project overview page with visual progress tracking, phase timeline, key metrics cards, recent activity feed, and quick action buttons. Transforms the basic project summary into a friendly, informative dashboard showing project health, completion status, and next steps. Uses glass morphism cards, animated progress bars, and color-coded phase indicators following Lynx Theme Pro aesthetic.

## Dependencies

- Feature 53 (Dynamic Phase Completion Detection) provides phase confidence scores and completion data.
- Feature 54 (Enhanced Discovery Chat UI) provides message counts and conversation metadata.
- Feature 55 (Research Phase Media Management) provides uploaded file counts.
- Feature 19 (Sequential Generation) provides diagram completion data.
- Feature 26 (Feature Specs Generation) provides spec counts.

## Context To Read First

- `context/ui-tokens.md` (Glass morphism, progress bar styling)
- `context/ui-rules.md` (Animation patterns, responsive design)
- `context/ui-registry.md` (PhaseProgressBar, PhaseTimeline, MetricsCard components)
- `context/build-plan.md` (Phase 8: Enhanced Project Overview)
- `context/progress-tracker.md`

## Context7 Docs To Check

- Recharts for progress visualization
- date-fns for date formatting

```bash
npx ctx7 library recharts "Progress circle with gradient fills"
npx ctx7 library date-fns "Relative time formatting (timeAgo)"
```

## Files Owned

- `app/(app)/projects/[projectId]/page.tsx` (complete redesign)
- `components/projects/PhaseProgressBar.tsx`
- `components/projects/PhaseTimeline.tsx`
- `components/projects/MetricsCard.tsx`
- `components/projects/ActivityFeed.tsx`
- `components/projects/QuickActions.tsx`
- `lib/projects/metrics.ts`
- `lib/projects/activity.ts`

## Files

MODIFY: `app/(app)/projects/[projectId]/page.tsx` - rebuild with friendly UI
CREATE: `components/projects/PhaseProgressBar.tsx` - animated progress bar with confidence
CREATE: `components/projects/PhaseTimeline.tsx` - vertical timeline with past/current/future states
CREATE: `components/projects/MetricsCard.tsx` - metric display with icon and value
CREATE: `components/projects/ActivityFeed.tsx` - recent activity list with timestamps
CREATE: `components/projects/QuickActions.tsx` - action buttons for resume/view/download
CREATE: `lib/projects/metrics.ts` - calculate project metrics
CREATE: `lib/projects/activity.ts` - fetch recent activity
MODIFY: `context/progress-tracker.md` - mark feature progress

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract (schema fields or relations, route signatures, helper signatures, AI task names or callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, or file ownership), update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch. Do not leave future specs with stale names, old API shapes, or invalid fields.

- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: Install `recharts` if not already present: `npm install recharts@2.15.0 --save-exact`
- **CRITICAL**: Install `date-fns` if not already present: `npm install date-fns@4.1.0 --save-exact`
- **CRITICAL**: All animations must follow `ui-rules.md` (< 500ms duration, 60fps, purposeful motion)

### Page Layout Structure

```tsx
// app/(app)/projects/[projectId]/page.tsx

export default async function ProjectOverviewPage({ params }: { params: { projectId: string } }) {
  const user = await getAuthUser();
  const project = await getProjectWithMetrics(params.projectId, user.id);
  
  if (!project) notFound();

  const metrics = calculateProjectMetrics(project);
  const recentActivity = await getRecentActivity(params.projectId);

  return (
    <div className="space-y-8 p-6">
      {/* Hero Section */}
      <section className="space-y-2">
        <h1 className="text-4xl font-black text-primary">{project.name}</h1>
        <p className="text-lg text-secondary">{project.description}</p>
      </section>

      {/* Phase Progress Section */}
      <section className="glass-medium rounded-lg p-6">
        <h2 className="text-2xl font-bold text-primary mb-4">Progress</h2>
        <PhaseProgressBar 
          currentPhase={project.currentPhase}
          totalPhases={project.totalPhases}
          confidence={project.phaseConfidence}
        />
        <PhaseTimeline phases={project.phases} currentPhaseIndex={project.currentPhaseIndex} />
      </section>

      {/* Metrics Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard label="Messages" value={metrics.messageCount} icon={MessageCircle} />
        <MetricsCard label="Files Uploaded" value={metrics.fileCount} icon={Upload} />
        <MetricsCard label="Diagrams" value={metrics.diagramCount} icon={Network} />
        <MetricsCard label="Feature Specs" value={metrics.specCount} icon={FileText} />
      </section>

      {/* Activity Feed */}
      <section className="glass-medium rounded-lg p-6">
        <h2 className="text-2xl font-bold text-primary mb-4">Recent Activity</h2>
        <ActivityFeed activities={recentActivity} />
      </section>

      {/* Quick Actions */}
      <QuickActions projectId={project.id} status={project.status} />
    </div>
  );
}
```

### PhaseProgressBar Component

**Animated progress bar with confidence indicator:**

```typescript
'use client';

import { useRef, useEffect } from 'react';
import { gsap } from '@/lib/gsap-config';

interface PhaseProgressBarProps {
  currentPhase: number;
  totalPhases: number;
  confidence?: number; // 0-100
}

export function PhaseProgressBar({ currentPhase, totalPhases, confidence }: PhaseProgressBarProps) {
  const progressRef = useRef<HTMLDivElement>(null);
  const percentage = (currentPhase / totalPhases) * 100;

  useEffect(() => {
    if (progressRef.current) {
      gsap.to(progressRef.current, {
        width: `${percentage}%`,
        duration: 0.8,
        ease: 'power3.out',
      });
    }
  }, [percentage]);

  return (
    <div className="space-y-2">
      {/* Progress Bar */}
      <div className="relative h-4 bg-surface rounded-full overflow-hidden">
        <div
          ref={progressRef}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/80 rounded-full"
          style={{ width: '0%' }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-sm">
        <span className="text-secondary">
          Phase {currentPhase} of {totalPhases}
        </span>
        {confidence !== undefined && (
          <span className={`font-semibold ${
            confidence >= 85 ? 'text-success' : 
            confidence >= 60 ? 'text-warning' : 
            'text-error'
          }`}>
            {confidence}% confidence
          </span>
        )}
      </div>
    </div>
  );
}
```

### PhaseTimeline Component

**Vertical timeline with color-coded states:**

```typescript
'use client';

import { CheckCircle, Circle, Clock } from 'lucide-react';

interface Phase {
  name: string;
  status: 'completed' | 'in-progress' | 'pending';
}

interface PhaseTimelineProps {
  phases: Phase[];
  currentPhaseIndex: number;
}

export function PhaseTimeline({ phases, currentPhaseIndex }: PhaseTimelineProps) {
  return (
    <div className="mt-6 space-y-4">
      {phases.map((phase, index) => {
        const isCompleted = index < currentPhaseIndex;
        const isCurrent = index === currentPhaseIndex;
        const isPending = index > currentPhaseIndex;

        return (
          <div key={index} className="flex items-start gap-4">
            {/* Icon */}
            <div className={`flex-shrink-0 ${
              isCompleted ? 'text-success' :
              isCurrent ? 'text-primary' :
              'text-muted'
            }`}>
              {isCompleted && <CheckCircle className="h-6 w-6" />}
              {isCurrent && <Clock className="h-6 w-6 animate-pulse" />}
              {isPending && <Circle className="h-6 w-6" />}
            </div>

            {/* Phase Name */}
            <div className="flex-1">
              <h3 className={`font-semibold ${
                isCompleted ? 'text-success' :
                isCurrent ? 'text-primary' :
                'text-muted'
              }`}>
                {phase.name}
              </h3>
              <p className="text-xs text-muted mt-1">
                {isCompleted && 'Completed'}
                {isCurrent && 'In Progress'}
                {isPending && 'Upcoming'}
              </p>
            </div>

            {/* Connecting Line */}
            {index < phases.length - 1 && (
              <div className={`absolute left-3 top-10 w-0.5 h-12 ${
                index < currentPhaseIndex ? 'bg-success' : 'bg-border'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
```

### MetricsCard Component

**Glass card with icon and value:**

```typescript
'use client';

import { LucideIcon } from 'lucide-react';

interface MetricsCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  trend?: 'up' | 'down';
}

export function MetricsCard({ label, value, icon: Icon, trend }: MetricsCardProps) {
  return (
    <div className="glass-medium rounded-lg p-6 space-y-2">
      {/* Icon */}
      <div className="flex items-center justify-between">
        <Icon className="h-8 w-8 text-primary" />
        {trend && (
          <span className={`text-xs ${trend === 'up' ? 'text-success' : 'text-error'}`}>
            {trend === 'up' ? '↑' : '↓'}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="text-3xl font-bold text-primary">{value}</div>

      {/* Label */}
      <div className="text-sm text-secondary">{label}</div>
    </div>
  );
}
```

### ActivityFeed Component

**Recent activity list with timestamps:**

```typescript
'use client';

import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Upload, Network, FileText, CheckCircle } from 'lucide-react';

interface Activity {
  id: string;
  type: 'message' | 'upload' | 'diagram' | 'spec' | 'completion';
  description: string;
  timestamp: Date;
}

interface ActivityFeedProps {
  activities: Activity[];
}

const ACTIVITY_ICONS = {
  message: MessageCircle,
  upload: Upload,
  diagram: Network,
  spec: FileText,
  completion: CheckCircle,
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted">
        No activity yet. Start by opening the discovery chat!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = ACTIVITY_ICONS[activity.type];

        return (
          <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg hover:bg-surface/50 transition-colors">
            {/* Icon */}
            <div className="flex-shrink-0 text-primary">
              <Icon className="h-5 w-5" />
            </div>

            {/* Description & Timestamp */}
            <div className="flex-1">
              <p className="text-sm text-primary">{activity.description}</p>
              <p className="text-xs text-muted mt-1">
                {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

### QuickActions Component

**Action buttons based on project status:**

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { MessageCircle, Network, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickActionsProps {
  projectId: string;
  status: string;
}

export function QuickActions({ projectId, status }: QuickActionsProps) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-4">
      {/* Resume Discovery */}
      {['DISCOVERY', 'REQUIREMENTS', 'ARCHITECTURE'].includes(status) && (
        <Button
          onClick={() => router.push(`/projects/${projectId}/discovery`)}
          className="flex items-center gap-2"
        >
          <MessageCircle className="h-5 w-5" />
          Resume Discovery
        </Button>
      )}

      {/* View Diagrams */}
      {['DIAGRAM_GENERATION', 'SPEC_GENERATION', 'COMPLETED'].includes(status) && (
        <Button
          variant="outline"
          onClick={() => router.push(`/projects/${projectId}/diagrams`)}
          className="flex items-center gap-2"
        >
          <Network className="h-5 w-5" />
          View Diagrams
        </Button>
      )}

      {/* Download ZIP */}
      {status === 'COMPLETED' && (
        <Button
          variant="outline"
          onClick={() => router.push(`/projects/${projectId}/export`)}
          className="flex items-center gap-2"
        >
          <Download className="h-5 w-5" />
          Download ZIP
        </Button>
      )}
    </div>
  );
}
```

### Metrics Calculation Logic

**Calculate project metrics:**

```typescript
// lib/projects/metrics.ts

import { prisma } from '@/lib/db';

export async function calculateProjectMetrics(projectId: string) {
  const [messageCount, fileCount, diagramCount, specCount] = await Promise.all([
    prisma.message.count({ where: { projectId } }),
    prisma.researchFile.count({ where: { projectId } }),
    prisma.diagram.count({ where: { projectId, status: 'DONE' } }),
    prisma.featureSpec.count({ where: { projectId } }),
  ]);

  return {
    messageCount,
    fileCount,
    diagramCount,
    specCount,
  };
}
```

### Activity Tracking Logic

**Fetch recent activity:**

```typescript
// lib/projects/activity.ts

import { prisma } from '@/lib/db';

export async function getRecentActivity(projectId: string, limit = 5) {
  const activities = [];

  // Recent messages
  const messages = await prisma.message.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    take: 2,
  });
  messages.forEach((msg) => {
    activities.push({
      id: msg.id,
      type: 'message' as const,
      description: `${msg.role === 'user' ? 'You' : 'AI'} sent a message`,
      timestamp: msg.createdAt,
    });
  });

  // Recent uploads
  const uploads = await prisma.researchFile.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    take: 2,
  });
  uploads.forEach((file) => {
    activities.push({
      id: file.id,
      type: 'upload' as const,
      description: `Uploaded ${file.fileName}`,
      timestamp: file.createdAt,
    });
  });

  // Recent diagrams
  const diagrams = await prisma.diagram.findMany({
    where: { projectId, status: 'DONE' },
    orderBy: { updatedAt: 'desc' },
    take: 1,
  });
  diagrams.forEach((diagram) => {
    activities.push({
      id: diagram.id,
      type: 'diagram' as const,
      description: `Generated ${diagram.diagramTypeId} diagram`,
      timestamp: diagram.updatedAt,
    });
  });

  // Sort by timestamp and limit
  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}
```

### Responsive Design

**Breakpoints:**
- Mobile (< 768px): Single column layout, stacked metrics
- Tablet (768px - 1024px): 2-column metrics grid
- Desktop (≥ 1024px): 4-column metrics grid

**Touch-Friendly:**
- All buttons min 44×44px
- Sufficient spacing between interactive elements
- No hover-only interactions (actions accessible via tap)

## Out of Scope

- Real-time activity updates (polling or WebSocket)
- Activity filtering by type
- Export activity log as CSV
- Custom metric widgets (user-configurable dashboard)

## Future Modifications

- Future features may add real-time activity updates via WebSocket
- Future features may add custom metric dashboards (user-selectable widgets)
- Future features may add project health score (based on completion, quality, etc.)

## Quality Gates

- Run `npm run test` and ensure it passes (minimum 10 new tests: 3 metrics, 3 timeline, 4 components)
- Run `npm run build` and ensure it passes
- Run `npm run security:all` and ensure it passes before push
- Visual regression testing with screenshots
- Test with various project states (discovery, diagrams, completed)

## Acceptance Criteria

- [ ] Overview page displays project name and description
- [ ] PhaseProgressBar shows current phase progress with animated fill
- [ ] Confidence score displayed when available (color-coded: green ≥85%, yellow 60-84%, red <60%)
- [ ] PhaseTimeline shows all phases with color-coded icons (checkmark=completed, clock=current, circle=pending)
- [ ] Current phase has pulsing animation
- [ ] Metrics cards display message count, file count, diagram count, spec count
- [ ] Metrics cards use glass morphism styling with icons
- [ ] Activity feed shows last 5 activities with icons and relative timestamps
- [ ] Activity feed shows "No activity yet" when empty
- [ ] Quick actions show relevant buttons based on project status
- [ ] "Resume Discovery" visible during discovery/requirements/architecture phases
- [ ] "View Diagrams" visible after diagram generation starts
- [ ] "Download ZIP" visible only when status is COMPLETED
- [ ] Responsive grid: 1 col mobile, 2 col tablet, 4 col desktop for metrics
- [ ] All animations run at 60fps with no layout shift
- [ ] Accessibility: Keyboard navigation, screen reader labels, ARIA attributes
- [ ] Non-member access returns 404
- [ ] `context/progress-tracker.md` updated to mark feature DONE
- [ ] `npm run build` passes with no warnings
- [ ] CodeRabbit review completed (recommended quality gate)