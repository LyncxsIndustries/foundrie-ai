You are helping instrument a Next.js SaaS app called Foundrie AI with PostHog analytics.  
The stack is: Next.js (App Router), Clerk (auth), Neon + Prisma (database), Trigger.dev  
(background jobs), React Flow (canvas/diagramming).

PostHog is already installed. Your job is to add event tracking across the app so the  
following dashboards have data: Growth Overview, Engagement & Retention, Product Usage  
(Canvas), Revenue & Conversion, Technical Health, and Churn Risk.

─────────────────────────────────────────  
1. POSTHOG SETUP (if not already done)  
─────────────────────────────────────────  
- Initialize PostHog in app/layout.tsx using the PostHogProvider pattern.  
- Call posthog.identify() after Clerk's useUser() resolves, passing:  
 userId: user.id  
 properties: {  
 email: user.emailAddresses[0].emailAddress,  
 name: user.fullName,  
 created_at: user.createdAt,  
 plan: <free|paid> (from your DB/Clerk metadata)  
 }  
- Call posthog.reset() on sign-out.

─────────────────────────────────────────  
2. SIGNUP FUNNEL EVENTS  
─────────────────────────────────────────  
These power the "Signup funnel" insight (Landing page → Sign up started → Sign up  
completed → First workspace created).

- On the marketing/landing page hero CTA click:  
 posthog.capture('signup_cta_clicked')

- When Clerk's <SignUp /> component mounts (sign-up page load):  
 posthog.capture('signup_started')

- In Clerk's afterSignUp callback or the redirect handler after signup completes:  
 posthog.capture('signup_completed', {  
 signup_method: 'email' | 'google' | 'github' // from Clerk strategy  
 })

- When a new workspace is first created (after DB insert via Prisma):  
 posthog.capture('workspace_created', {  
 workspace_id: workspace.id,  
 is_first_workspace: true  
 })

─────────────────────────────────────────  
3. ACTIVATION & CANVAS EVENTS  
─────────────────────────────────────────  
These power "Time to first value", "Activation rate", and all Canvas insights.

- When a user adds any node to the React Flow canvas:  
 posthog.capture('node_added', {  
 node_type: node.type, // e.g. 'service', 'database', 'api'  
 project_id: currentProject.id,  
 total_nodes_in_project: nodes.length  
 })

- When a diagram is saved (auto-save or manual):  
 posthog.capture('diagram_saved', {  
 project_id: currentProject.id,  
 node_count: nodes.length,  
 edge_count: edges.length,  
 save_trigger: 'auto' | 'manual'  
 })

─────────────────────────────────────────  
4. COLLABORATION EVENTS  
─────────────────────────────────────────  
- When a user sends a collaboration invite:  
 posthog.capture('collaborator_invited', {  
 project_id: currentProject.id,  
 invitee_role: 'viewer' | 'editor'  
 })

- When a collaborative session has 2+ concurrent users (track on presence join):  
 posthog.capture('collab_session_active', {  
 project_id: currentProject.id,  
 concurrent_users: presenceCount  
 })

─────────────────────────────────────────  
5. EXPORT & SHARE EVENTS  
─────────────────────────────────────────  
- When export or share is triggered:  
 posthog.capture('export_clicked', {  
 export_format: 'png' | 'svg' | 'json' | 'link',  
 project_id: currentProject.id  
 })

─────────────────────────────────────────  
6. REVENUE & CONVERSION EVENTS  
─────────────────────────────────────────  
These power the "Free-to-paid funnel", "Paywall hit rate", and "Trial expiration" insights.

- When a free user hits a feature-gated action and sees a paywall/upgrade prompt:  
 posthog.capture('paywall_hit', {  
 feature: 'export' | 'collaboration' | 'ai_generation' | <feature_name>,  
 plan: 'free'  
 })

- When a user clicks any upgrade/upsell CTA:  
 posthog.capture('upgrade_clicked', {  
 source: 'paywall' | 'settings' | 'banner' | 'trial_expiry_modal',  
 plan_target: 'pro' | 'team'  
 })

- When a trial expires (trigger from a Trigger.dev scheduled job or webhook):  
 posthog.capture('trial_expired', {  
 trial_length_days: 14,  
 converted: false // set to true if they upgraded before expiry  
 })

─────────────────────────────────────────  
7. TECHNICAL HEALTH EVENTS (server-side)  
─────────────────────────────────────────  
These power the "Trigger.dev job success/failure" and "API error rate" insights.  
Fire these from the server using the PostHog Node SDK.

In every Trigger.dev task, wrap the handler:

 // On success  
 posthog.capture({  
 distinctId: userId,  
 event: 'trigger_job_completed',  
 properties: {  
 job_name: task.id,  
 duration_ms: performance.now() - start  
 }  
 })  
 await posthog.flushAsync()

 // On failure (in the catch block)  
 posthog.capture({  
 distinctId: userId,  
 event: 'trigger_job_failed',  
 properties: {  
 job_name: task.id,  
 error_message: error.message,  
 error_type: error.constructor.name  
 }  
 })  
 await posthog.flushAsync()

For API routes, add a global error handler middleware that fires:  
 posthog.capture({  
 distinctId: userId ?? 'anonymous',  
 event: 'api_error',  
 properties: {  
 route: req.nextUrl.pathname,  
 method: req.method,  
 status_code: response.status,  
 error_message: error.message  
 }  
 })

─────────────────────────────────────────  
8. SESSION RECORDINGS — TARGETED FILTERS  
─────────────────────────────────────────  
PostHog session replay is already capturing sessions. No code changes needed, but  
make sure these two recording filters exist in PostHog:

Filter 1 — Signup abandonment:  
 Person did "signup_started" AND did NOT do "signup_completed" within the same session.

Filter 2 — Activation drop-off:  
 Person did "workspace_created" AND did NOT do "node_added" (ever, within 24 hours).

─────────────────────────────────────────  
9. PERSON PROPERTIES TO KEEP UPDATED  
─────────────────────────────────────────  
Call posthog.people.set() (or pass $set in any capture call) to keep these up to date:

 {  
 plan: 'free' | 'pro' | 'team',  
 workspaces_created: <count>,  
 first_node_added_at: <ISO timestamp>, // set once  
 trial_started_at: <ISO timestamp>,  
 trial_ends_at: <ISO timestamp>  
 }

─────────────────────────────────────────  
IMPLEMENTATION RULES  
─────────────────────────────────────────  
- All client-side captures use the posthog-js browser SDK.  
- All server-side captures (Trigger.dev jobs, API routes) use posthog-node.  
- Never fire events for internal/admin users — check user role before capturing.  
- Always include project_id on any canvas or collaboration event.  
- Keep property names snake_case.  
- Do not fire events in development unless NODE_ENV === 'production' or a debug  
 flag is set.  