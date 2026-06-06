# FOUNDRIE AI — Research & Operating Specification
## Version 11.0.0

**Version**: 11.0.0
**Release Date**: 2026-05-19
**Status**: Superseded by v12.0.0
**Previous Version**: 10.0.0
**Base**: All v1.0.0 through v10.0.0 content remains in force. This version only documents what changes.
**Purpose**: Define Foundrie's full commercialization model: scale architecture for millions of concurrent users, MongoDB Atlas training data isolation, data breach response protocol, pricing tiers (Free/Pro/Team/Enterprise) with feature flag enforcement, Stripe subscription integration, and entitlement activation flow. Also specifies the scale-aware deployment targets and per-region data residency policy.
**Source Research**: FOUNDRIE-RUWA-PATCH.md §9

---

## CHANGELOG — v11.0.0

### New [NEW]
- Global edge + multi-region architecture for Foundrie at scale (1M+ concurrent users): Cloudflare → Vercel Edge → Rust Axum (ECS Fargate) → Python LangGraph (GPU ECS) → Neon Postgres (primary + 3 read replicas per region).
- Performance targets at scale: discovery response P99 < 8s, diagram generation P99 < 15s, ZIP generation P99 < 5s, file upload (100MB) P99 < 30s.
- NATS JetStream AI request queuing — queue position indicator shown to user when AI provider is rate-limited.
- Auto-scaling policy: Rust Axum on ECS Fargate scales by CPU + queue depth. Neon read replicas handle read queries; primary handles writes. PgBouncer in transaction mode for connection pooling.
- Three deployment regions: `us-east-1`, `eu-west-1`, `ap-southeast-1` with data residency routing.
- MongoDB Atlas training data cluster (separate from production Neon Postgres) — three collections: `foundrie_sessions`, `ruwa_sessions`, `shared_outcomes`. Complete isolation from production DB.
- Why MongoDB for training data: schema-flexible documents, horizontal write scaling, native JSON, no JSONB column overhead.
- Foundrie + RUWA shared training pipeline: join on `project_id` to correlate plan quality with build success rate.
- Data Breach Response Protocol: 15-minute containment, 1-hour assessment, 24-hour notification, recovery steps, and post-mortem obligations. Specifies exactly what was and was not architecturally possible to expose.
- Pricing Tiers: Foundrie Free ($0), Foundrie Pro ($12/mo), Foundrie Team ($8/user/mo, min 3), Foundrie Enterprise (contact). RUWA Free ($0), RUWA Pro ($15/mo), RUWA Team ($10/user/mo), RUWA Enterprise (contact).
- `PLAN_FEATURES` TypeScript constant — enforces feature flags from `db.user.subscriptionPlan`.
- `canUseFeature()` utility function — all feature gates resolved through this single function.
- Stripe integration: Stripe Checkout for upgrades, Stripe Customer Portal for self-service management, Stripe Webhooks for entitlement activation (`customer.subscription.updated`, `invoice.payment_succeeded`, `customer.subscription.deleted`).
- Webhook handler (`app/api/webhooks/stripe/route.ts`) — entitlements activated within seconds of payment confirmation. No manual provisioning.
- `PRICE_TO_PLAN` mapping — maps Stripe Price IDs to internal plan names.
- Free tier sustainability model: < $0.05 per session AI cost at 10 sessions/month/user.
- Pricing philosophy: stay below Anthropic Claude products and OpenAI Codex. Free tier genuinely useful — not crippled.
- DeepSeek R1 as the default AI model for Free tier (fast, good quality, lower cost). Claude Sonnet 4 for Pro/Team/Enterprise.
- Generation invariants 78–86 added.

### Changes to Existing Content
- **Multi-Model Rotation (v2.0.0 §5)**: Free-tier users route to DeepSeek R1 first; paid users route to Claude Sonnet 4 first. Fallback chain unchanged.
- **Data Flywheel (v4.0.0 §1)**: MongoDB Atlas training cluster now formally specified as the destination. NATS JetStream is the telemetry pipeline transport.
- **File Storage (v2.0.0 §3)**: Vercel Blob containers are now per-subscription-tier: Free tier files deleted after 30 days; Pro/Team files retained for 2 years.

### Deprecated
- Nothing deprecated. All v10.0.0 content preserved.

---

## TABLE OF CONTENTS (v11.0.0 additions only)

1. [Scale Architecture — Millions of Users](#1-scale-architecture)
2. [Performance Targets at Scale](#2-performance-targets)
3. [AI Request Queuing with NATS JetStream](#3-ai-request-queuing)
4. [Training Data Architecture — MongoDB Atlas](#4-training-data-architecture)
5. [Foundrie + RUWA Shared Training Pipeline](#5-shared-training-pipeline)
6. [Data Breach Response Protocol](#6-data-breach-response-protocol)
7. [Pricing Tiers — Foundrie and RUWA](#7-pricing-tiers)
8. [Feature Flag Enforcement](#8-feature-flag-enforcement)
9. [Stripe Subscription Integration](#9-stripe-subscription-integration)
10. [New Generation Invariants (78–86)](#10-new-generation-invariants)

---

## 1. SCALE ARCHITECTURE — MILLIONS OF USERS

```
┌────────────────────────────────────────────────────────────────────┐
│  GLOBAL EDGE LAYER                                                   │
│  Cloudflare (DDoS, WAF, CDN) → Vercel Edge Network                 │
│  Anycast routing → nearest region to user                          │
├────────────────────────────────────────────────────────────────────┤
│  WEB APP LAYER                                                       │
│  Next.js 16 on Vercel (auto-scales to 0–N instances)               │
│  Vercel Edge Middleware (auth, rate limiting, geo-routing)          │
├────────────────────────────────────────────────────────────────────┤
│  API LAYER                                                           │
│  Rust Axum on AWS ECS Fargate (auto-scales by CPU + queue depth)   │
│  Go API gateway for inter-service routing (v2.0.0)                 │
│  Regions: us-east-1, eu-west-1, ap-southeast-1                     │
├────────────────────────────────────────────────────────────────────┤
│  AI LAYER                                                            │
│  Python LangGraph on AWS ECS (GPU instances for inference)         │
│  Multi-provider routing: Anthropic → Gemini → DeepSeek (fallback)  │
│  Rust key rotation engine: 50+ API keys per provider (v2.0.0)     │
├────────────────────────────────────────────────────────────────────┤
│  DATA LAYER                                                          │
│  Neon Postgres (primary + 3 read replicas per region)              │
│  Upstash Redis (session cache, rate limiting, idempotency cache)    │
│  ChromaDB on dedicated nodes (vector search)                        │
│  Vercel Blob (file storage, diagram storage)                        │
├────────────────────────────────────────────────────────────────────┤
│  TRAINING DATA LAYER [SEPARATED — CRITICAL]                          │
│  MongoDB Atlas (training signal storage) — separate cluster        │
│  Access: read-only from AI training pipeline, write from telemetry  │
│  Zero cross-access with production Neon Postgres                   │
└────────────────────────────────────────────────────────────────────┘
```

**Data residency routing:**
- Users in EU: routed to `eu-west-1`. Data at rest stays in EU. GDPR compliance.
- Users in APAC: routed to `ap-southeast-1`.
- All others: routed to `us-east-1`.
- Neon Postgres has per-region branches — user session data written to the user's region.

---

## 2. PERFORMANCE TARGETS AT SCALE

```
Discovery conversation response:    P99 < 8 seconds (LLM latency dominates)
Diagram generation:                 P99 < 15 seconds (complex multi-node diagrams)
ZIP generation:                     P99 < 5 seconds (Rust streaming — v2.0.0)
File upload (100MB):                P99 < 30 seconds (streaming chunks — v10.0.0)

Database connection pooling:
  PgBouncer in transaction mode
  Read queries → Neon read replicas
  Write queries → Neon primary

Auto-scaling triggers:
  Rust Axum ECS service: scale out at CPU > 60% or AI queue depth > 50
  Python LangGraph ECS: scale out at GPU utilization > 70%
  Scale-in delay: 10 minutes (prevents thrashing during session bursts)

Cost per user per month (free tier):
  Target: < $0.05 per session (AI API costs, amortized)
  Free tier sustainable: up to 10 sessions/month/user at this rate
```

---

## 3. AI REQUEST QUEUING WITH NATS JETSTREAM

When the AI provider is rate-limited or at capacity, Foundrie does not return an error — it queues the request.

```
USER EXPERIENCE DURING QUEUING:

  User submits discovery message.
  AI provider is at capacity.

  Foundrie UI shows:
  ┌─────────────────────────────────────────────┐
  │  ⏳ Generating your architecture...          │
  │  Queue position: 3 — estimated wait: ~45s   │
  │  You'll be notified when it's ready.        │
  └─────────────────────────────────────────────┘

  This is not an error. It is a transparent queue position indicator.
  The user can continue annotating diagrams or reviewing specs while waiting.
  When the AI finishes, the response streams automatically.
```

**NATS JetStream implementation:**

```go
// Go API gateway — publishes AI requests to NATS subject
import nats "github.com/nats-io/nats.go"

func publishAIRequest(nc *nats.Conn, req AIRequest) error {
    js, _ := nc.JetStream()
    data, _ := json.Marshal(req)
    // durable consumer — survives gateway restarts
    _, err := js.Publish("foundrie.ai.requests", data)
    return err
}
```

```python
# Python LangGraph worker — pulls from NATS JetStream queue
import nats

async def ai_worker():
    nc = await nats.connect(os.environ["NATS_URL"])
    js = nc.jetstream()
    sub = await js.subscribe("foundrie.ai.requests", durable="ai-workers")
    async for msg in sub.messages:
        request = AIRequest.model_validate_json(msg.data)
        await process_discovery_turn(request)
        await msg.ack()
```

**Priority routing by subscription tier:**

```
Enterprise / Team users → dedicated NATS subject → dedicated worker pool → no queue
Pro users              → priority NATS subject   → priority worker pool → short queue
Free users             → standard NATS subject   → shared worker pool  → queue position shown
```

---

## 4. TRAINING DATA ARCHITECTURE — MONGODB ATLAS

### Why MongoDB (Not Neon Postgres)

Training data is document-oriented, schema-flexible, and write-heavy. Each training sample has a variable structure that changes as Foundrie versions evolve:

```json
{
  "session_id": "sess_a1b2c3",
  "timestamp": "2026-05-19T09:31:00Z",
  "foundrie_version": "11.0.0",
  "turns": [
    { "role": "user", "content": "[SCRUBBED]", "turn": 1 },
    { "role": "assistant", "content": "[SCRUBBED]", "turn": 1 }
  ],
  "architecture_proposal": { "stack": "Next.js + Rust", "containers": [...] },
  "diagrams_generated": 12,
  "diagram_approval_iterations": 2,
  "feature_count": 14,
  "quality_label": "ACCEPTED",
  "ruwa_build_feedback": { "first_build_pass": true, "spec_discrepancies": 0 },
  "subscription_tier": "pro"
}
```

PostgreSQL handles this but requires JSONB columns and loses schema clarity as the structure evolves. MongoDB handles it natively, scales writes horizontally across shards, and supports flexible schema evolution without migrations.

### Complete Data Isolation

```
PRODUCTION DB (Neon Postgres):
  - User accounts, sessions, projects, specs, feature specs, billing data
  - Access: Foundrie web app, RUWA, Rust API
  - Encryption: Neon AES-256 at rest, TLS 1.3 in transit

TRAINING DATA DB (MongoDB Atlas):
  - Anonymized session data, quality labels, build signals, implicit feedback
  - Access: telemetry writer (write-only), training pipeline (read-only)
  - Encryption: MongoDB Atlas encryption at rest, TLS in transit
  - No PII: all user identifiers hashed with per-user salt before storage (v3.0.0)
  - Retention: indefinite (training data only becomes more valuable over time)

CROSS-DB ACCESS POLICY:
  The telemetry service has write access to MongoDB. No other service does.
  The training pipeline has read access to MongoDB. No other service does.
  Neither has access to the production DB.
  The production DB never reads from MongoDB.
  Violation of this isolation is a FATAL security event — breach response triggered.
```

---

## 5. FOUNDRIE + RUWA SHARED TRAINING PIPELINE

Both tools observe the same engineering workflow from different angles. Their signals are joined to produce the highest-value training data:

```
MONGODB ATLAS COLLECTIONS:

foundrie_sessions/
  → Written by: Foundrie telemetry service
  → Signal: discovery quality, diagram approval iterations, spec revision count,
            which hidden requirements were surfaced, ZIP download rate

ruwa_sessions/
  → Written by: RUWA telemetry service
  → Signal: first-build pass rate, spec discrepancy count, feature completion time,
            repo health check outcomes, upstream conflict frequency

shared_outcomes/
  → Written by: both services, keyed by project_id
  → Signal: connects Foundrie plan quality to RUWA build outcomes
  → Example: "Foundrie generated 3 hidden requirement warnings → RUWA had 0
              spec discrepancies on this project" = high quality plan

TRAINING PIPELINE (reads from all three collections):
  Join: foundrie_sessions + ruwa_sessions on project_id
  Derive: "spec quality score" = function(diagram_approval_iters, spec_discrepancies, build_pass)
  Label: sessions with score > 0.85 as "POSITIVE" training examples
  Label: sessions with score < 0.4 as "NEGATIVE" training examples
  Feed: labeled pairs into DPO/RLVR fine-tuning (v4.0.0 §5)
```

**The key insight:** Foundrie generates specs → RUWA tries to implement them → build pass/fail is a verifiable reward signal → Foundrie is fine-tuned to produce specs that produce passing builds. This is RLVR (v4.0.0 §5) applied to the plan-to-build pipeline.

---

## 6. DATA BREACH RESPONSE PROTOCOL

### First 15 Minutes — Containment

```
1. Identify the breach vector:
   Which service? Which user? Which access pattern?
   Source: Cloudflare anomaly detection, AWS GuardDuty,
           MongoDB Atlas anomaly alerts, Neon Postgres audit logs.

2. Rotate all production secrets immediately:
   AWS KMS → new encryption keys generated
   All Clerk API keys rotated
   All database credentials rotated
   All Stripe webhook secrets rotated

3. Revoke all active user sessions — force re-authentication for all users.

4. Kill suspicious database connections (pg_terminate_backend where applicable).

5. Enable read-only mode if write access is the breach vector.

6. Snapshot all database state for forensic analysis (Neon point-in-time).
```

### First Hour — Assessment

```
7. What data was accessed?
   Answer from: immutable audit logs (append-only, v3.0.0 §7 — this is answerable).

8. Were any secrets exposed?
   Training data: no secrets stored there (only anonymized session data).
   Production DB: user account data may be accessible.

9. Was any user PII exposed?
   User identifiers: hashed (one-way) — direct PII cannot be derived.
   Full conversation content: never stored in identifiable form.
   Billing data: Stripe handles all card data — not in our systems.

10. Scope: how many users affected?
    Query Neon audit logs for the breach time window.
```

### First 24 Hours — Notification

```
11. Notify affected users by email within 72 hours (GDPR Article 33 requirement).
12. Notify data protection authority if > 250 users affected (GDPR).
13. Post a public status page update: transparent, factual, no PR spin.
    Format: "What happened, what data was involved, what we are doing, what you should do."
```

### Recovery

```
14. Patch the breach vector before re-enabling write access.
15. Restore from last known-good snapshot if data was modified maliciously.
16. Force password/credential resets for affected accounts.
17. Publish a post-mortem within 30 days (GDPR requirement + engineering trust).
```

### What the Architecture Prevents From Being Exposed

```
The following cannot be leaked by a breach of Foundrie's systems:

- Full conversation content: never stored identifiably in production DB.
- User codebases: stored in Vercel Blob; access requires session token + HMAC (v10.0.0).
- API keys uploaded by users: blocked by the 6-step file security pipeline (v10.0.0 §3).
- Credit card data: Stripe handles this. PCI DSS is Stripe's compliance domain.
- Training data PII: all user identifiers one-way hashed before MongoDB storage.

This limits the blast radius of any breach significantly. The architecture
is designed so that even a complete production DB breach exposes only:
- Hashed user IDs (one-way, not reversible without salt)
- Session metadata (timestamps, feature counts, plan tier)
- GitHub repo names (if connected)
- Foundrie project names (engineer-chosen)
```

---

## 7. PRICING TIERS — FOUNDRIE AND RUWA

### Foundrie Pricing

```
FREE — $0/month
  Sessions per month:           10
  Features per project:         up to 15
  Collaborators per session:    1 (solo only)
  GitHub repos connected:       3
  File uploads per session:     5 files, max 10MB total
  Diagram types:                all types
  ZIP export:                   unlimited
  AI model:                     DeepSeek R1 (fast, good quality)
  File/diagram retention:       30 days
  Support:                      community only

PRO — $12/month
  Sessions per month:           unlimited
  Features per project:         unlimited
  Collaborators per session:    up to 5
  GitHub repos connected:       unlimited
  File uploads per session:     50 files, max 500MB total
  Diagram types:                all types + Figma bidirectional export (v10.0.0)
  ZIP export:                   unlimited
  AI model:                     Claude Sonnet 4 (best quality)
  File/diagram retention:       2 years
  Priority in AI request queue
  Support:                      email, < 48h response

TEAM — $8/user/month (minimum 3 users)
  Everything in Pro, per seat
  Shared session library across team
  Team templates (reuse architecture across projects)
  Admin dashboard (usage, seats, billing)
  SSO (Google Workspace, Azure AD)
  Shared GitHub App installation (one install for entire org)
  Collaborative sessions: unlimited collaborators
  Custom AI model configuration
  Support:                      email + chat, < 24h response

ENTERPRISE — contact for pricing
  Self-hosted option (Foundrie deployed on customer's infrastructure)
  Air-gapped deployment for classified/sensitive projects
  Custom SLA (99.9% uptime guarantee)
  Dedicated support engineer (named contact)
  Custom data retention and isolation policy
  Compliance exports (SOC 2 Type II report, GDPR DPA)
  Single tenant Neon Postgres instance
```

### RUWA Pricing

```
FREE — $0/month
  Projects per month:           5
  Features implemented/month:   up to 20
  GitHub repos connected:       3
  AI model:                     DeepSeek R1
  Session memory:               local only (no cloud sync)
  Support:                      community only

PRO — $15/month
  Projects:                     unlimited
  Features:                     unlimited
  GitHub repos connected:       unlimited
  AI model:                     Claude Sonnet 4
  Session memory:               cloud sync (Mem0 backed by Foundrie cloud)
  Multi-model fallback:         enabled
  Priority in AI request queue
  Support:                      email, < 48h response

TEAM — $10/user/month
  Everything in Pro
  Shared project context (team-wide Foundrie ZIP access)
  Admin dashboard
  Custom ARTKINS_STYLE_GUIDE.md per organization
  SSO
  Support:                      email + chat, < 24h response

ENTERPRISE — contact for pricing
  Self-hosted RUWA (Rust binary deployed on-premises)
  Air-gapped deployment
  Custom SLA
  Bring-your-own LLM model (point RUWA at self-hosted Claude/DeepSeek)
```

---

## 8. FEATURE FLAG ENFORCEMENT

All feature availability is resolved from `db.user.subscriptionPlan`. No feature is gated by hardcoded logic outside this system.

```typescript
// lib/plans.ts — generated in Foundrie's own codebase
export const PLAN_FEATURES = {
  free: {
    max_sessions: 10,
    max_collaborators: 1,
    max_features: 15,
    ai_model: 'deepseek-r1',
    github_repos: 3,
    figma_export: false,
    team_templates: false,
    priority_queue: false,
    file_retention_days: 30,
    max_upload_mb: 10,
  },
  pro: {
    max_sessions: Infinity,
    max_collaborators: 5,
    max_features: Infinity,
    ai_model: 'claude-sonnet-4-20250514',
    github_repos: Infinity,
    figma_export: true,
    team_templates: false,
    priority_queue: true,
    file_retention_days: 730,
    max_upload_mb: 500,
  },
  team: {
    max_sessions: Infinity,
    max_collaborators: Infinity,
    max_features: Infinity,
    ai_model: 'claude-sonnet-4-20250514',
    github_repos: Infinity,
    figma_export: true,
    team_templates: true,
    priority_queue: true,
    file_retention_days: 730,
    max_upload_mb: 500,
  },
} as const;

export function canUseFeature(
  user: { subscriptionPlan: keyof typeof PLAN_FEATURES; usageCount: Record<string, number> },
  feature: keyof typeof PLAN_FEATURES['free'],
): boolean {
  const plan = PLAN_FEATURES[user.subscriptionPlan];
  const value = plan[feature];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    return value === Infinity || (user.usageCount[feature] ?? 0) < value;
  }
  return false;
}
```

**Enforcement points:**
- `canUseFeature()` is called at every API route that touches a gated feature.
- The UI disables gated buttons using the same function (via a shared response from the API).
- Stripe entitlement changes propagate to `db.user.subscriptionPlan` within seconds via webhook (Section 9).
- Feature gates are never enforced by client-side-only logic.

---

## 9. STRIPE SUBSCRIPTION INTEGRATION

### Payment Flow

```
User clicks "Upgrade to Pro"
→ Foundrie calls Stripe Checkout API (server-side)
→ User is redirected to Stripe-hosted Checkout page
→ User enters card details (PCI DSS is Stripe's responsibility)
→ Payment confirmed
→ Stripe sends webhook: customer.subscription.created
→ Foundrie webhook handler updates db.user.subscriptionPlan = 'pro'
→ canUseFeature() now returns true for Pro features
→ User is redirected back to Foundrie (already upgraded)
```

### Webhook Handler

```typescript
// app/api/webhooks/stripe/route.ts — generated in Foundrie's own codebase
import Stripe from 'stripe';

const PRICE_TO_PLAN: Record<string, 'pro' | 'team' | 'enterprise'> = {
  [process.env.STRIPE_PRICE_PRO!]:        'pro',
  [process.env.STRIPE_PRICE_TEAM!]:       'team',
  [process.env.STRIPE_PRICE_ENTERPRISE!]: 'enterprise',
};

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0].price.id;
      const plan = PRICE_TO_PLAN[priceId] ?? 'free';
      await db.user.update({
        where: { stripeCustomerId: sub.customer as string },
        data: {
          subscriptionPlan: plan,
          subscriptionStatus: sub.status,
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        },
      });
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await db.user.update({
        where: { stripeCustomerId: sub.customer as string },
        data: { subscriptionPlan: 'free', subscriptionStatus: 'cancelled' },
      });
      break;
    }
    case 'invoice.payment_failed': {
      // Email user, set status to past_due, restrict to free-tier features after grace period
      break;
    }
  }

  return new Response('OK', { status: 200 });
}
```

**Stripe Connect (planned for v12.0.0+):** Marketplace for community-contributed Foundrie project templates. Template authors earn a revenue share when their template is used as a session starting point.

### Subscription Self-Service

Users manage their own subscriptions via the Stripe Customer Portal (no custom billing UI needed):

```typescript
// app/api/billing/portal/route.ts
export async function POST(req: Request) {
  const { userId } = await auth();
  const user = await db.user.findUnique({ where: { clerkId: userId } });

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_URL}/settings/billing`,
  });

  return Response.json({ url: portalSession.url });
}
```

Users can cancel, downgrade, update payment method, and view invoice history — all without contacting Foundrie support.

---

## 10. NEW GENERATION INVARIANTS (78–86)

These are **additions** to invariants 1–77. All prior invariants remain in force.

78. Foundrie's production deployment targets three regions (`us-east-1`, `eu-west-1`, `ap-southeast-1`). User sessions are routed to the nearest region and data at rest is stored in that region. This is non-negotiable for GDPR compliance.

79. MongoDB Atlas training data cluster is completely isolated from the production Neon Postgres database. No service has access to both. Cross-database access is a FATAL security event.

80. All user identifiers in MongoDB training data are one-way hashed with a per-user salt before storage. Raw user IDs never enter the training cluster.

81. Free-tier users are served by DeepSeek R1. Pro/Team/Enterprise users are served by Claude Sonnet 4 as primary. The AI model selection is derived from `db.user.subscriptionPlan` at request time — never hardcoded per endpoint.

82. All feature gates are resolved through `canUseFeature()`. No other gating mechanism is used. Client-side-only gating without server enforcement is a security violation.

83. Stripe Checkout handles all payment collection. Card data never touches Foundrie's servers. Entitlements activate within seconds of Stripe webhook delivery — no manual provisioning.

84. Every Stripe webhook is verified with `stripe.webhooks.constructEvent()` before processing. Unverified webhooks are rejected with 400 — never processed.

85. When AI providers are rate-limited, requests are queued in NATS JetStream and the user sees a queue position indicator — not an error. The response streams automatically when the worker picks it up.

86. The data breach response protocol (Section 6) is a mandatory operational document for the Foundrie engineering team. It is reviewed and updated quarterly or after any security incident.

---

*Foundrie AI v11.0.0 — Commercialization: scale architecture, MongoDB training data isolation, data breach response, pricing tiers (Free/Pro/Team/Enterprise), and Stripe subscription integration*
*See FOUNDRIE_V12_0_0.md for production logging scaffolding, context/memory/harness engineering integration into the platform, and the Mem0/FastMCP/Firecrawl production agent stack*
