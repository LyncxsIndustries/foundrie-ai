# Feature 106 - PostHog Event Instrumentation Master Plan

## Type

INSTRUMENTATION

## What This Delivers

Establishes the complete PostHog event taxonomy, property naming conventions, and instrumentation architecture for Foundrie AI. Defines which events map to which dashboards (Growth Overview, Engagement & Retention, Product Usage, Revenue & Conversion, Technical Health, Churn Risk), standardizes property names, and creates shared instrumentation helpers. After this feature, all subsequent event instrumentation specs follow a unified schema.

## Dependencies

- Feature 56 (PostHog Token Guard) - environment-based token
- Feature 57 (PostHog before_send Hook) - PII scrubbing
- Feature 58 (PostHog Default Date) - configuration presets
- Feature 59 (Liveblocks Reset on Sign Out) - session boundary
- Feature 60 (Liveblocks Identify Scrub) - identify call scrubbing
- Feature 61 (PostHog Server Logger) - server-side logging

## Context To Read First

- `context/architecture-context.md`
- `research/POSTHOG_MASTER_PROMPT.md`
- `research/POSTHOG_CONFIGURATION_AUDIT.md`
- `context/code-standards.md`

## Context7 Docs To Check

```bash
npx ctx7 library "posthog-js" "event tracking best practices"
npx ctx7 library "posthog-node" "server side tracking"
```

## Files Owned

- `lib/posthog/events.ts` (NEW)
- `lib/posthog/helpers.ts` (NEW)
- `lib/posthog/types.ts` (NEW)
- `docs/POSTHOG_EVENT_TAXONOMY.md` (NEW)

## Files

CREATE: `lib/posthog/events.ts` - centralized event name constants
CREATE: `lib/posthog/helpers.ts` - shared instrumentation utilities
CREATE: `lib/posthog/types.ts` - TypeScript types for all event properties
CREATE: `docs/POSTHOG_EVENT_TAXONOMY.md` - complete event catalog with dashboard mappings
MODIFY: `lib/posthog-server.ts` - add helper imports
CREATE: `lib/posthog/events.test.ts` - test event taxonomy
CREATE: `lib/posthog/helpers.test.ts` - test helper utilities

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract, update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch.

### Event Taxonomy Structure

```typescript
// lib/posthog/events.ts

export const POSTHOG_EVENTS = {
  // Signup Funnel (Features 56-61 base, Feature 107 implementation)
  SIGNUP_CTA_CLICKED: 'signup_cta_clicked',
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',
  WORKSPACE_CREATED: 'workspace_created',
  
  // Activation & Canvas (Feature 108)
  NODE_ADDED: 'node_added',
  EDGE_CREATED: 'edge_created',
  DIAGRAM_SAVED: 'diagram_saved',
  DIAGRAM_EXPORTED: 'diagram_exported',
  DISCOVERY_CHAT_STARTED: 'discovery_chat_started',
  DISCOVERY_CHAT_COMPLETED: 'discovery_chat_completed',
  REQUIREMENTS_GENERATED: 'requirements_generated',
  
  // Collaboration (Feature 109)
  COLLABORATOR_INVITED: 'collaborator_invited',
  COLLAB_SESSION_ACTIVE: 'collab_session_active',
  PRESENCE_JOINED: 'presence_joined',
  CANVAS_EDIT_REALTIME: 'canvas_edit_realtime',
  
  // Export & Share (Feature 109)
  EXPORT_CLICKED: 'export_clicked',
  ZIP_GENERATED: 'zip_generated',
  ZIP_DOWNLOADED: 'zip_downloaded',
  
  // Revenue & Conversion (Feature 110)
  PAYWALL_HIT: 'paywall_hit',
  UPGRADE_CLICKED: 'upgrade_clicked',
  TRIAL_STARTED: 'trial_started',
  TRIAL_EXPIRED: 'trial_expired',
  SUBSCRIPTION_CREATED: 'subscription_created',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  
  // Technical Health (Feature 111)
  TRIGGER_JOB_STARTED: 'trigger_job_started',
  TRIGGER_JOB_COMPLETED: 'trigger_job_completed',
  TRIGGER_JOB_FAILED: 'trigger_job_failed',
  API_ERROR: 'api_error',
  
  // Engagement
  PROJECT_OPENED: 'project_opened',
  PROJECT_DELETED: 'project_deleted',
  SETTINGS_CHANGED: 'settings_changed',
} as const;

export type PostHogEventName = typeof POSTHOG_EVENTS[keyof typeof POSTHOG_EVENTS];
```

### Property Naming Convention

```typescript
// lib/posthog/types.ts

// All properties snake_case
export interface BaseEventProperties {
  project_id?: string;
  user_id?: string;
  session_id?: string;
  timestamp?: string;
}

export interface SignupEventProperties extends BaseEventProperties {
  signup_method: 'email' | 'google' | 'github';
  referral_source?: string;
  is_first_workspace: boolean;
}

export interface CanvasEventProperties extends BaseEventProperties {
  node_type?: string;
  node_count?: number;
  edge_count?: number;
  diagram_type?: string;
  save_trigger?: 'auto' | 'manual';
}

export interface CollaborationEventProperties extends BaseEventProperties {
  invitee_role?: 'viewer' | 'editor';
  concurrent_users?: number;
}

export interface RevenueEventProperties extends BaseEventProperties {
  plan: 'free' | 'pro' | 'team' | 'enterprise';
  plan_target?: 'pro' | 'team' | 'enterprise';
  feature?: string;
  source?: 'paywall' | 'settings' | 'banner' | 'trial_expiry_modal';
  trial_length_days?: number;
  converted?: boolean;
}

export interface TechnicalEventProperties extends BaseEventProperties {
  job_name?: string;
  duration_ms?: number;
  error_message?: string;
  error_type?: string;
  route?: string;
  method?: string;
  status_code?: number;
}
```

### Helper Utilities

```typescript
// lib/posthog/helpers.ts

import { posthog } from './client';
import { POSTHOG_EVENTS, type PostHogEventName } from './events';
import type { BaseEventProperties } from './types';

/**
 * Check if PostHog tracking is enabled (production + not internal user)
 */
export function isTrackingEnabled(userEmail?: string): boolean {
  if (process.env.NODE_ENV !== 'production') return false;
  
  // Don't track internal/admin users
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
  if (userEmail && adminEmails.includes(userEmail)) return false;
  
  return true;
}

/**
 * Safely capture event with automatic environment/user checks
 */
export function captureEvent(
  eventName: PostHogEventName,
  properties?: Record<string, any>,
  userEmail?: string
): void {
  if (!isTrackingEnabled(userEmail)) return;
  
  try {
    posthog.capture(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[PostHog] Failed to capture event:', eventName, error);
  }
}

/**
 * Server-side event capture helper
 */
export async function captureServerEvent(
  distinctId: string,
  eventName: PostHogEventName,
  properties?: Record<string, any>
): Promise<void> {
  if (process.env.NODE_ENV !== 'production') return;
  
  try {
    const { PostHog } = await import('posthog-node');
    const client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!);
    
    client.capture({
      distinctId,
      event: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
      },
    });
    
    await client.flushAsync();
  } catch (error) {
    console.error('[PostHog] Server capture failed:', eventName, error);
  }
}

/**
 * Extract project context for event properties
 */
export function getProjectContext(projectId: string): BaseEventProperties {
  return {
    project_id: projectId,
    timestamp: new Date().toISOString(),
  };
}
```

### Dashboard Mapping

```markdown
# docs/POSTHOG_EVENT_TAXONOMY.md

# PostHog Event Taxonomy

Complete catalog of all PostHog events in Foundrie AI, organized by dashboard.

## Dashboard: Growth Overview

### Signup Funnel
- `signup_cta_clicked` → Landing page CTA click
- `signup_started` → Sign up page loaded
- `signup_completed` → Account created
  - Properties: `signup_method` (email/google/github)
- `workspace_created` → First project created
  - Properties: `is_first_workspace` (boolean)

### Activation Metrics
- Time to first value: `workspace_created` → `node_added` (first)
- Activation rate: % users who complete `node_added` within 7 days

## Dashboard: Engagement & Retention

### Core Actions
- `project_opened` → User views project
- `node_added` → Canvas interaction
- `diagram_saved` → Work persisted
- `discovery_chat_started` → Discovery initiated
- `discovery_chat_completed` → Discovery finished

### Retention Cohorts
- D1, D7, D30 retention based on `project_opened` events

## Dashboard: Product Usage (Canvas)

### Canvas Interactions
- `node_added` → Node placed on canvas
  - Properties: `node_type`, `total_nodes_in_project`
- `edge_created` → Connection drawn
  - Properties: `total_edges_in_project`
- `diagram_saved` → Canvas persisted
  - Properties: `node_count`, `edge_count`, `save_trigger` (auto/manual)

### Diagram Generation
- `diagram_exported` → Diagram exported
  - Properties: `export_format` (png/svg/json)

## Dashboard: Revenue & Conversion

### Free-to-Paid Funnel
- `paywall_hit` → Feature gate encountered
  - Properties: `feature`, `plan` (free)
- `upgrade_clicked` → Upgrade CTA clicked
  - Properties: `source`, `plan_target`
- `subscription_created` → Payment completed
  - Properties: `plan` (pro/team/enterprise)

### Trial Management
- `trial_started` → Trial begins
  - Properties: `trial_length_days`
- `trial_expired` → Trial ends
  - Properties: `converted` (boolean)

## Dashboard: Technical Health

### Trigger.dev Jobs
- `trigger_job_started` → Job execution begins
  - Properties: `job_name`
- `trigger_job_completed` → Job succeeds
  - Properties: `job_name`, `duration_ms`
- `trigger_job_failed` → Job fails
  - Properties: `job_name`, `error_message`, `error_type`

### API Monitoring
- `api_error` → API route error
  - Properties: `route`, `method`, `status_code`, `error_message`

## Dashboard: Churn Risk

### Churn Signals
- No `project_opened` in 7 days
- `trial_expired` with `converted: false`
- `subscription_cancelled`
```

## Out of Scope

- Actual event capture calls (Features 107-112)
- Dashboard creation in PostHog UI (manual setup)
- Session replay filters (PostHog UI configuration)
- Person properties updates (Feature 107-110)

## Future Modifications

- Feature 107 - Signup & Activation Funnel Events (uses event constants)
- Feature 108 - Canvas & Product Usage Events (uses helpers)
- Feature 109 - Collaboration & Sharing Events (uses types)
- Feature 110 - Revenue & Conversion Events (uses server helpers)
- Feature 111 - Trigger.dev Task Instrumentation (uses server capture)
- Feature 112 - API Error Tracking (uses error helpers)

## Quality Gates

- Run `npm run sync:check` and ensure it passes
- Run `npm run security:all` and ensure it passes
- Run `npm run test` and ensure it passes
- Run `npm run build` and ensure it passes

## Acceptance Criteria

- [ ] `lib/posthog/events.ts` exports all event name constants
- [ ] `lib/posthog/types.ts` defines TypeScript interfaces for all event properties
- [ ] `lib/posthog/helpers.ts` provides `captureEvent` and `captureServerEvent` utilities
- [ ] `isTrackingEnabled()` checks NODE_ENV and admin email list
- [ ] `getProjectContext()` extracts project_id for event properties
- [ ] All property names are snake_case
- [ ] Event names match PostHog dashboard requirements
- [ ] `docs/POSTHOG_EVENT_TAXONOMY.md` documents all events with dashboard mappings
- [ ] Helper functions include error handling with console.error fallback
- [ ] Server-side capture uses posthog-node with flushAsync
- [ ] Tests verify event taxonomy completeness
- [ ] Tests verify helper utilities work correctly
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at Feature 107
- [ ] All quality gates pass
- [ ] CodeRabbit review completed and all findings resolved (recommended quality gate)

## Setup Instructions

No new external accounts or API keys required. This feature uses existing PostHog configuration from Features 56-61.

For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
