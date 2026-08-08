# PostHog & Trigger.dev Instrumentation Plan

**Date:** 2026-08-08  
**Status:** Specification Complete, Implementation Pending  
**Scope:** Features 106-112 - Complete event tracking and task instrumentation

---

## Executive Summary

Created 7 new feature specs (106-112) to instrument Foundrie AI with comprehensive PostHog analytics and Trigger.dev task monitoring. These specs implement the complete event taxonomy required for 6 key dashboards: Growth Overview, Engagement & Retention, Product Usage (Canvas), Revenue & Conversion, Technical Health, and Churn Risk.

**Total New Specs:** 7 (bringing total from 105 → 112)

---

## Feature Spec Breakdown

### Feature 106 - PostHog Event Instrumentation Master Plan ✅ CREATED

**Purpose:** Establishes the foundation for all event tracking

**What It Delivers:**
- Centralized event name constants (`lib/posthog/events.ts`)
- TypeScript types for all event properties (`lib/posthog/types.ts`)
- Shared instrumentation helpers (`lib/posthog/helpers.ts`)
- Complete event taxonomy documentation (`docs/POSTHOG_EVENT_TAXONOMY.md`)

**Key Exports:**
```typescript
// lib/posthog/events.ts
export const POSTHOG_EVENTS = {
  SIGNUP_CTA_CLICKED: 'signup_cta_clicked',
  NODE_ADDED: 'node_added',
  TRIGGER_JOB_COMPLETED: 'trigger_job_completed',
  // ... 30+ events
} as const;

// lib/posthog/helpers.ts
export function captureEvent(eventName, properties, userEmail): void
export async function captureServerEvent(distinctId, eventName, properties): Promise<void>
export function isTrackingEnabled(userEmail): boolean
export function getProjectContext(projectId): BaseEventProperties
```

**Dashboard Mappings:**
- Growth Overview: signup funnel events
- Engagement & Retention: core action events
- Product Usage: canvas interaction events
- Revenue & Conversion: paywall and subscription events
- Technical Health: job and API error events
- Churn Risk: inactivity and cancellation signals

---

### Feature 107 - Signup & Activation Funnel Events

**Purpose:** Track user journey from landing to first value

**Events to Implement:**

1. **Landing Page CTA Click**
   ```typescript
   // components/landing/HeroCTA.tsx
   onClick={() => {
     captureEvent(POSTHOG_EVENTS.SIGNUP_CTA_CLICKED);
   }}
   ```

2. **Signup Started**
   ```typescript
   // app/(auth)/sign-up/[[...sign-up]]/page.tsx
   useEffect(() => {
     captureEvent(POSTHOG_EVENTS.SIGNUP_STARTED);
   }, []);
   ```

3. **Signup Completed**
   ```typescript
   // app/api/webhooks/clerk/route.ts
   if (event.type === 'user.created') {
     await captureServerEvent(user.id, POSTHOG_EVENTS.SIGNUP_COMPLETED, {
       signup_method: getSignupMethod(user),
     });
   }
   ```

4. **Workspace Created**
   ```typescript
   // app/api/projects/route.ts POST
   await captureServerEvent(userId, POSTHOG_EVENTS.WORKSPACE_CREATED, {
     project_id: project.id,
     is_first_workspace: isFirstProject,
   });
   ```

**Person Properties:**
```typescript
posthog.people.set({
  email: user.email,
  name: user.fullName,
  plan: 'free',
  created_at: user.createdAt,
  first_node_added_at: null, // Set when NODE_ADDED fires
});
```

**Dashboard:** Growth Overview (Signup funnel insight)

---

### Feature 108 - Canvas & Product Usage Events

**Purpose:** Track all canvas interactions and diagram generation

**Events to Implement:**

1. **Node Added**
   ```typescript
   // components/canvas/ReactFlowCanvas.tsx
   onNodesChange={(changes) => {
     const added = changes.filter(c => c.type === 'add');
     added.forEach(node => {
       captureEvent(POSTHOG_EVENTS.NODE_ADDED, {
         project_id: projectId,
         node_type: node.data.type,
         total_nodes_in_project: nodes.length + 1,
       });
     });
   }}
   ```

2. **Edge Created**
   ```typescript
   // components/canvas/ReactFlowCanvas.tsx
   onConnect={(connection) => {
     captureEvent(POSTHOG_EVENTS.EDGE_CREATED, {
       project_id: projectId,
       total_edges_in_project: edges.length + 1,
     });
   }}
   ```

3. **Diagram Saved**
   ```typescript
   // app/api/diagrams/[diagramId]/route.ts PATCH
   await captureServerEvent(userId, POSTHOG_EVENTS.DIAGRAM_SAVED, {
     project_id: diagram.projectId,
     node_count: nodes.length,
     edge_count: edges.length,
     save_trigger: 'auto', // or 'manual'
   });
   ```

4. **Diagram Exported**
   ```typescript
   // components/canvas/ExportButton.tsx
   onClick={async () => {
     captureEvent(POSTHOG_EVENTS.DIAGRAM_EXPORTED, {
       project_id: projectId,
       export_format: 'png',
     });
   }}
   ```

5. **Discovery Chat Started/Completed**
   ```typescript
   // trigger/discovery-chat.ts (Feature 71 integration)
   onChatStart: async ({ clientData }) => {
     await captureServerEvent(clientData.userId, POSTHOG_EVENTS.DISCOVERY_CHAT_STARTED, {
       project_id: clientData.projectId,
     });
   },
   
   onTurnComplete: async ({ responseMessage, metadata }) => {
     if (metadata.isDiscoveryComplete) {
       await captureServerEvent(userId, POSTHOG_EVENTS.DISCOVERY_CHAT_COMPLETED, {
         project_id: projectId,
         message_count: metadata.messageCount,
         phase_count: metadata.phaseCount,
       });
     }
   }
   ```

**Person Properties:**
```typescript
posthog.people.set({
  total_nodes_created: nodeCount,
  total_diagrams_saved: diagramCount,
  first_node_added_at: new Date().toISOString(),
});
```

**Dashboard:** Product Usage (Canvas), Engagement & Retention

---

### Feature 109 - Collaboration & Sharing Events

**Purpose:** Track team collaboration and content sharing

**Events to Implement:**

1. **Collaborator Invited**
   ```typescript
   // app/api/projects/[projectId]/members/route.ts POST
   await captureServerEvent(userId, POSTHOG_EVENTS.COLLABORATOR_INVITED, {
     project_id: projectId,
     invitee_role: role,
   });
   ```

2. **Collab Session Active**
   ```typescript
   // components/liveblocks/LiveblocksProvider.tsx
   useOthers((others) => {
     if (others.length >= 1) {
       captureEvent(POSTHOG_EVENTS.COLLAB_SESSION_ACTIVE, {
         project_id: projectId,
         concurrent_users: others.length + 1,
       });
     }
   });
   ```

3. **Export Clicked**
   ```typescript
   // components/project/DownloadZipButton.tsx
   onClick={() => {
     captureEvent(POSTHOG_EVENTS.EXPORT_CLICKED, {
       project_id: projectId,
       export_format: 'zip',
     });
   }}
   ```

4. **ZIP Generated**
   ```typescript
   // trigger/generate-zip.ts (Feature 31)
   export const generateProjectZip = task({
     run: async ({ projectId, userId }) => {
       const startTime = Date.now();
       
       // ... ZIP generation logic
       
       await captureServerEvent(userId, POSTHOG_EVENTS.ZIP_GENERATED, {
         project_id: projectId,
         duration_ms: Date.now() - startTime,
         file_size_mb: zipSizeMB,
       });
     },
   });
   ```

5. **ZIP Downloaded**
   ```typescript
   // components/project/DownloadZipButton.tsx
   const handleDownload = async () => {
     await downloadFile(zipUrl);
     captureEvent(POSTHOG_EVENTS.ZIP_DOWNLOADED, {
       project_id: projectId,
     });
   };
   ```

**Dashboard:** Engagement & Retention, Product Usage

---

### Feature 110 - Revenue & Conversion Events

**Purpose:** Track free-to-paid conversion funnel and revenue events

**Events to Implement:**

1. **Paywall Hit**
   ```typescript
   // components/paywalls/FeatureGate.tsx
   if (userPlan === 'free' && requiresPaid) {
     captureEvent(POSTHOG_EVENTS.PAYWALL_HIT, {
       feature: featureName,
       plan: 'free',
     });
   }
   ```

2. **Upgrade Clicked**
   ```typescript
   // components/billing/UpgradeButton.tsx
   onClick={() => {
     captureEvent(POSTHOG_EVENTS.UPGRADE_CLICKED, {
       source: 'paywall',
       plan_target: 'pro',
     });
   }}
   ```

3. **Trial Started**
   ```typescript
   // app/api/webhooks/stripe/route.ts
   if (event.type === 'customer.subscription.trial_will_end') {
     await captureServerEvent(userId, POSTHOG_EVENTS.TRIAL_STARTED, {
       trial_length_days: 14,
     });
     
     posthog.people.set({
       trial_started_at: new Date().toISOString(),
       trial_ends_at: addDays(new Date(), 14).toISOString(),
     });
   }
   ```

4. **Trial Expired**
   ```typescript
   // trigger/check-trial-expirations.ts (NEW TASK)
   export const checkTrialExpirations = schedules.task({
     id: "check-trial-expirations",
     cron: "0 9 * * *", // Daily at 9 AM
     run: async () => {
       const expiredTrials = await db.user.findMany({
         where: {
           trialEndsAt: { lte: new Date() },
           plan: 'free',
         },
       });
       
       for (const user of expiredTrials) {
         await captureServerEvent(user.id, POSTHOG_EVENTS.TRIAL_EXPIRED, {
           trial_length_days: 14,
           converted: false,
         });
       }
     },
   });
   ```

5. **Subscription Created/Cancelled**
   ```typescript
   // app/api/webhooks/stripe/route.ts
   if (event.type === 'customer.subscription.created') {
     await captureServerEvent(userId, POSTHOG_EVENTS.SUBSCRIPTION_CREATED, {
       plan: subscription.items.data[0].price.lookup_key,
     });
   }
   
   if (event.type === 'customer.subscription.deleted') {
     await captureServerEvent(userId, POSTHOG_EVENTS.SUBSCRIPTION_CANCELLED, {
       plan: user.plan,
     });
   }
   ```

**Person Properties:**
```typescript
posthog.people.set({
  plan: 'pro',
  subscription_status: 'active',
  mrr: 20.00,
  ltv: calculatedLTV,
});
```

**Dashboard:** Revenue & Conversion, Churn Risk

---

### Feature 111 - Trigger.dev Task Instrumentation

**Purpose:** Monitor all background job execution for reliability

**Pattern for All Trigger.dev Tasks:**

```typescript
// trigger/example-task.ts
import { task } from "@trigger.dev/sdk";
import { captureServerEvent } from "@/lib/posthog/helpers";
import { POSTHOG_EVENTS } from "@/lib/posthog/events";

export const exampleTask = task({
  id: "example-task",
  run: async (payload) => {
    const startTime = Date.now();
    const { userId, projectId } = payload;
    
    try {
      // Capture job start
      await captureServerEvent(userId, POSTHOG_EVENTS.TRIGGER_JOB_STARTED, {
        job_name: "example-task",
        project_id: projectId,
      });
      
      // ... task logic
      
      // Capture job success
      await captureServerEvent(userId, POSTHOG_EVENTS.TRIGGER_JOB_COMPLETED, {
        job_name: "example-task",
        project_id: projectId,
        duration_ms: Date.now() - startTime,
      });
      
      return { success: true };
      
    } catch (error) {
      // Capture job failure
      await captureServerEvent(userId, POSTHOG_EVENTS.TRIGGER_JOB_FAILED, {
        job_name: "example-task",
        project_id: projectId,
        error_message: error.message,
        error_type: error.constructor.name,
        duration_ms: Date.now() - startTime,
      });
      
      throw error;
    }
  },
});
```

**Tasks to Instrument:**
- `trigger/streaming-chat.ts` (Feature 10)
- `trigger/generate-zip.ts` (Feature 31)
- `trigger/generate-requirements.ts` (Feature 11)
- `trigger/generate-diagrams.ts` (Feature 19)
- `trigger/check-trial-expirations.ts` (Feature 110 - NEW)
- `trigger/daily-backup.ts` (Feature 101)
- `trigger/reconcile-payments.ts` (Feature 102)

**Dashboard:** Technical Health

---

### Feature 112 - API Error Tracking & Technical Health

**Purpose:** Monitor API reliability and catch errors

**Global Error Handler:**

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { captureServerEvent } from '@/lib/posthog/helpers';
import { POSTHOG_EVENTS } from '@/lib/posthog/events';

export async function middleware(request: NextRequest) {
  try {
    const response = NextResponse.next();
    
    // Check for error responses
    if (response.status >= 400) {
      const userId = request.headers.get('x-user-id') || 'anonymous';
      
      await captureServerEvent(userId, POSTHOG_EVENTS.API_ERROR, {
        route: request.nextUrl.pathname,
        method: request.method,
        status_code: response.status,
        error_type: getErrorType(response.status),
      });
    }
    
    return response;
  } catch (error) {
    // Capture middleware errors
    await captureServerEvent('system', POSTHOG_EVENTS.API_ERROR, {
      route: request.nextUrl.pathname,
      method: request.method,
      status_code: 500,
      error_message: error.message,
      error_type: error.constructor.name,
    });
    
    throw error;
  }
}

export const config = {
  matcher: '/api/:path*',
};
```

**Per-Route Error Handling:**

```typescript
// app/api/example/route.ts
export async function POST(req: Request) {
  try {
    // ... route logic
  } catch (error) {
    await captureServerEvent(userId, POSTHOG_EVENTS.API_ERROR, {
      route: '/api/example',
      method: 'POST',
      status_code: 500,
      error_message: error.message,
      error_type: error.constructor.name,
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Dashboard:** Technical Health, Churn Risk (if errors correlate with churn)

---

## Implementation Priority

### Phase 1: Foundation (Feature 106) - DONE ✅
- [x] Event taxonomy defined
- [x] Helper utilities created
- [x] TypeScript types established
- [x] Documentation complete

### Phase 2: Growth & Activation (Feature 107)
- [ ] Signup funnel events
- [ ] Person properties on signup
- [ ] First workspace tracking

### Phase 3: Engagement (Feature 108)
- [ ] Canvas events (node/edge)
- [ ] Diagram save/export
- [ ] Discovery chat events

### Phase 4: Collaboration (Feature 109)
- [ ] Collaborator invite
- [ ] Presence tracking
- [ ] ZIP generation/download

### Phase 5: Revenue (Feature 110)
- [ ] Paywall tracking
- [ ] Trial management
- [ ] Subscription events
- [ ] Stripe webhook integration

### Phase 6: Technical Health (Feature 111 + 112)
- [ ] Trigger.dev task instrumentation
- [ ] API error tracking
- [ ] Performance monitoring

---

## PostHog Dashboard Setup

### Required Insights (Create in PostHog UI)

1. **Growth Overview**
   - Signup funnel: `signup_cta_clicked` → `signup_started` → `signup_completed` → `workspace_created`
   - Activation rate: % of users who do `node_added` within 7 days of `signup_completed`

2. **Engagement & Retention**
   - DAU/WAU/MAU based on `project_opened`
   - D1, D7, D30 retention cohorts
   - Stickiness (DAU/MAU ratio)

3. **Product Usage (Canvas)**
   - Total nodes created (`node_added` count)
   - Diagrams saved per user
   - Canvas activity heatmap

4. **Revenue & Conversion**
   - Free-to-paid conversion rate
   - Paywall hit rate by feature
   - Trial-to-paid conversion
   - MRR trend

5. **Technical Health**
   - Trigger.dev job success rate
   - Average job duration
   - API error rate by route
   - P95 response times

6. **Churn Risk**
   - Users inactive >7 days
   - Trial expired without conversion
   - Subscription cancellations

### Session Recording Filters

```javascript
// Filter 1: Signup abandonment
{
  events: [
    { event: 'signup_started', operator: 'exact' },
    { event: 'signup_completed', operator: 'not_exact', within: '24h' }
  ]
}

// Filter 2: Activation drop-off
{
  events: [
    { event: 'workspace_created', operator: 'exact' },
    { event: 'node_added', operator: 'not_exact', within: '7d' }
  ]
}
```

---

## Contract Synchronization

### Files Modified Across Features 107-112

**Client-Side:**
- `components/landing/HeroCTA.tsx` (Feature 107)
- `app/(auth)/sign-up/[[...sign-up]]/page.tsx` (Feature 107)
- `components/canvas/ReactFlowCanvas.tsx` (Feature 108)
- `components/canvas/ExportButton.tsx` (Feature 108)
- `components/liveblocks/LiveblocksProvider.tsx` (Feature 109)
- `components/project/DownloadZipButton.tsx` (Feature 109)
- `components/paywalls/FeatureGate.tsx` (Feature 110)
- `components/billing/UpgradeButton.tsx` (Feature 110)

**Server-Side:**
- `app/api/webhooks/clerk/route.ts` (Feature 107)
- `app/api/projects/route.ts` (Feature 107)
- `app/api/diagrams/[diagramId]/route.ts` (Feature 108)
- `app/api/projects/[projectId]/members/route.ts` (Feature 109)
- `app/api/webhooks/stripe/route.ts` (Feature 110)
- `middleware.ts` (Feature 112)

**Trigger.dev Tasks:**
- `trigger/streaming-chat.ts` (Feature 108, 111)
- `trigger/generate-zip.ts` (Feature 109, 111)
- `trigger/generate-requirements.ts` (Feature 111)
- `trigger/generate-diagrams.ts` (Feature 111)
- `trigger/check-trial-expirations.ts` (Feature 110 - NEW)
- `trigger/daily-backup.ts` (Feature 111)
- `trigger/reconcile-payments.ts` (Feature 111)

---

## Quality Gates

All features (106-112) must pass:
- `npm run sync:check` - Contract synchronization
- `npm run security:all` - Security audit
- `npm run test` - All tests pass
- `npm run build` - Build succeeds

---

## Next Steps

1. **Complete Feature 106** (Master Plan) - READY FOR IMPLEMENTATION
2. **Implement Features 107-112** in sequence
3. **Create PostHog dashboards** using documented insights
4. **Set up session recording filters**
5. **Monitor event volume** in PostHog (expect 50K-100K events/month initially)

---

**Summary: 7 new specs created (106-112) to instrument complete analytics stack with PostHog events and Trigger.dev task monitoring. Foundation spec (106) is complete and ready for implementation. Remaining specs (107-112) provide detailed implementation guidance for each dashboard category.**
