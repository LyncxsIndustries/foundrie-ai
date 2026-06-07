# Feature 03 - Database Schema

## Type

NEW FEATURE

## What This Delivers

The production-grade Neon Postgres + Prisma data layer for Foundrie AI: pooled runtime connections and direct migration connections via `prisma.config.ts` (Prisma 7), all core schema models, auth plan/role fields, Stripe/subscription fields, research models, project-specific agent skills, execution-plan approval records, performance and partial indexes, autovacuum tuning, and query-safety foundations. After this feature, `db` is exported and the schema applies cleanly against Neon.

## Dependencies

- Feature 02 (Auth) must be complete (Clerk session foundation exists).
- Context7 docs for Prisma and Neon must be checked before implementation.
- Neon connection URI values must be available in environment variables.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Prisma `/prisma/web`
- Neon Postgres `/websites/neon`

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `prisma/schema.prisma`
- `prisma/config.ts` / `prisma.config.ts`
- `prisma/migrations/**`
- `prisma/README.md`
- `lib/db.ts` (or `lib/prisma.ts`)

## Files

CREATE: `prisma/schema.prisma` - minimalist datasource + all models and enums.
CREATE: `prisma.config.ts` - environment loading and database URLs (Prisma 7).
CREATE: `lib/db.ts` - Prisma client singleton exported as `db`.
CREATE: `prisma/README.md` - query discipline checklist, monitoring SQL, Neon parameter recommendations.
CREATE: `prisma/migrations/<timestamp>_init/migration.sql` (generated) plus a raw SQL migration for partial indexes and autovacuum tuning.
MODIFY: `.env.example` - `DATABASE_URL` (pooled `-pooler`) and `DIRECT_URL` (direct).
MODIFY: `package.json` - `db:generate`, `db:push`, `db:migrate`, `db:studio` scripts.
RUN: `npm run db:migrate`
RUN: `npm run db:generate`

## Implementation Notes

### Neon environment and Prisma 7 configuration
- Neon Postgres is the only supported provider. `DATABASE_URL` is the pooled `-pooler` runtime URL; `DIRECT_URL` is the direct URL used only by the Prisma CLI/migrations.
- `prisma.config.ts` manages env loading and URLs; `schema.prisma` datasource is minimalist (`provider = "postgresql"`).

```typescript
import { config } from 'dotenv';
config({ path: '.env.local' });
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: { url: process.env.DIRECT_URL || env('DATABASE_URL') },
});
```

### Models
- Create: `User`, `Project`, `Conversation`, `Requirements`, `Diagram`, `ContextFile`, `FeatureSpec`, `ResearchDocument`, `ResearchAsset`, `ResearchSource`, `ProjectAgentSkill`, `ExecutionPlan`. (`ProjectMember` is added in Feature 35.)
- Enums: `UserPlan` (FREE/PRO/ENTERPRISE), `UserRole` (USER/ADMIN), `ProjectStatus`, `ConversationPhase`, `DiagramStatus`, `ContextFileType`, `ResearchAssetType`, `ResearchSourceProvider`, `ResearchSourceStatus`, `ExecutionPlanStatus`.
- `User`: `clerkId @unique`, `email @unique`, `name?`, `plan @default(FREE)`, `role @default(USER)`, and subscription fields `stripeCustomerId?`, `subscriptionPlan?`, `subscriptionStatus?`, `currentPeriodEnd?`.
- `Project`: denormalized counters `diagramCount`, `completedDiagramCount`, `featureSpecCount`; ZIP metadata `lastZipUrl`, `lastZipGeneratedAt`, `lastZipFileName`.
- Use JSON fields only for naturally whole-document data (conversation messages, requirements JSON, React Flow nodes/edges). Comment large JSON fields so list views avoid selecting them.

### Indexes
- `Project`: `@@index([userId])`, `@@index([userId, updatedAt(sort: Desc)])`, `@@index([slug])`, `@@index([status])`.
- `Conversation`: `@@index([projectId, phase])`, `@@index([projectId, updatedAt(sort: Desc)])`.
- `Diagram`: `@@index([projectId])`, `@@index([projectId, category, orderInCategory])`.
- `ContextFile`: `@@unique([projectId, fileType])`, `@@index([projectId, fileType])`.
- `FeatureSpec`: `@@unique([projectId, order])`, `@@index([projectId, order])`.
- `ResearchDocument`: `@@index([projectId])`, `@@index([projectId, sourceType])`.
- `ResearchAsset`: `@@index([projectId])`, `@@index([projectId, assetType])`.
- `ResearchSource`: `@@index([projectId])`, `@@index([projectId, provider])`, `@@index([projectId, status])`.
- `ProjectAgentSkill`: `@@unique([projectId, slug])`, `@@index([projectId])`.
- `ExecutionPlan`: `@@index([projectId])`, `@@index([projectId, status])`, `@@index([projectId, taskType])`.
- Rely on `@unique` for `User.clerkId`, `User.email`, `Requirements.projectId`.

### Research and execution-plan models
- `ResearchDocument` stores Markdown research (PROJECT_RESEARCH.md, source summaries, visual analyses, motion plans, comparisons, Context7 findings). `ResearchAsset` stores Blob-backed asset metadata (assetType: image asset, screenshot, inspiration, document, frame ZIP, frame, scrape capture). `ResearchSource` stores URL-based research (provider: manual, Context7, Tavily, Obscura, upload-derived). Do not store raw binary in PostgreSQL.
- `ProjectAgentSkill` stores `.agents/skills/<slug>/SKILL.md` content for export. `ExecutionPlan` fields: `id`, `projectId`, `taskType`, `content`, `status` (PROPOSED/APPROVED/REVISION_REQUESTED/REJECTED/EXECUTED), `revisionNotes`, `approvedAt`, `executedAt`, timestamps — gating architecture/diagram/context/spec/skill/ZIP/coding work. Passive discovery and research intake do not require an ExecutionPlan.

### Raw SQL migration (partial indexes + autovacuum)

```sql
CREATE INDEX CONCURRENTLY idx_diagrams_generating ON diagrams(project_id, updated_at)
  WHERE status IN ('QUEUED', 'GENERATING', 'RENDERING', 'CAPTURING');
CREATE INDEX CONCURRENTLY idx_diagrams_has_png ON diagrams(project_id)
  WHERE png_storage_url IS NOT NULL;
ALTER TABLE diagrams SET (autovacuum_vacuum_scale_factor = 0.01, autovacuum_analyze_scale_factor = 0.005, autovacuum_vacuum_cost_delay = 2);
ALTER TABLE conversations SET (autovacuum_vacuum_scale_factor = 0.02, autovacuum_analyze_scale_factor = 0.01, autovacuum_vacuum_cost_delay = 2);
```

- Create indexes `CONCURRENTLY` in production. If a local migration cannot run `CONCURRENTLY` inside Prisma's transaction, split the production index migration into a manual SQL step documented in `prisma/README.md`.

### Prisma client and query safety
- Export `db` (pooled `DATABASE_URL`), cached on `globalThis` in development. Dev logs query/error/warn; production logs error only.
- Document default isolation (read committed for reads, `RepeatableRead` for ZIP multi-table collection, `Serializable` only for compare-then-write order allocation), cursor-pagination requirement, and a query review checklist (no N+1, select only needed columns, no large JSON in lists, EXPLAIN slow queries) in `prisma/README.md`.
- Document enabling `pg_stat_statements` and Neon parameters (`statement_timeout = 30s`, `idle_in_transaction_session_timeout = 10s`, `lock_timeout = 5s`).

## Out of Scope

- Team, organization, project-member, owner/editor/viewer, ABAC, or audit-log tables (ProjectMember is Feature 35).
- PostgreSQL Row-Level Security.
- API routes, AI, canvas, diagram, ZIP, and research ingestion logic.

## Future Modifications

- Feature 04: Project CRUD adds Clerk webhook sync, `requireAuth()`, and `canCreateProject()`.
- Feature 35: Adds the `ProjectMember` model and `ProjectMemberRole` enum.
- Later billing feature: Stripe-backed plan changes use the existing subscription fields.

## Acceptance Criteria

- [ ] Neon pooled/direct env vars are documented.
- [ ] Prisma datasource is configured via `prisma.config.ts`; `schema.prisma` datasource is minimalist (provider only).
- [ ] `db` is exported and cached on `globalThis` in development.
- [ ] User schema includes `plan`, `role`, `UserPlan`, `UserRole`, and subscription fields.
- [ ] All listed models, enums, and indexes exist in Prisma or raw SQL migrations.
- [ ] `ProjectAgentSkill` and `ExecutionPlan` models exist with required indexes.
- [ ] Autovacuum tuning and monitoring SQL are documented.
- [ ] No team workspace, multi-role project RBAC, RLS, ABAC, or audit-log tables exist.
- [ ] Migration runs successfully against Neon and `npm run db:generate` produces the client.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- All CodeRabbit reviews must pass. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
