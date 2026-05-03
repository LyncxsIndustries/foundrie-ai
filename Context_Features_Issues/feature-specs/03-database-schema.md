# 03 - Database Schema

## Type

NEW FEATURE

## Goal

Create the production-grade Neon Postgres + Prisma data layer for Foundrie AI: pooled runtime connections, direct migration connections, read-replica-ready clients, schema models, auth plan/role fields, project-specific agent skills, execution plan approval records, performance indexes, partial indexes, autovacuum tuning, and query-safety foundations.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Prisma `/prisma/web`
- Neon Postgres `/websites/neon`

Use installed Context7 skills or:

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Implementation

### Neon Environment

- Use Neon Postgres as the only supported database provider.
- Add `.env.example` entries:
  - `DATABASE_URL`: Neon pooled runtime URL using the `-pooler` endpoint.
  - `DIRECT_URL`: Neon direct URL for Prisma CLI and migrations only.
  - `DATABASE_READ_REPLICA_URL`: optional Neon read replica pooled URL.
- Do not use any alternate or generic database provider path in the implementation.

### Prisma Datasource

- Configure `prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

- Ensure Prisma CLI/migrations use the direct Neon URL and application runtime uses the pooled URL.

### Prisma Models

- Create models: User, Project, Conversation, Requirements, Diagram, ContextFile, FeatureSpec, ResearchDocument, ResearchAsset, ResearchSource, ProjectAgentSkill, ExecutionPlan.
- Add enums: UserPlan, UserRole, ProjectStatus, ConversationPhase, DiagramStatus, ContextFileType, ResearchAssetType, ResearchSourceProvider, ResearchSourceStatus, ExecutionPlanStatus.
- `User` must include:
  - `clerkId String @unique`
  - `email String @unique`
  - `name String?`
  - `plan UserPlan @default(FREE)`
  - `role UserRole @default(USER)`
- Add project status phases from discovery through complete.
- Add denormalized dashboard counters on Project:
  - `diagramCount Int @default(0)`
  - `completedDiagramCount Int @default(0)`
  - `featureSpecCount Int @default(0)`
- Use JSON fields only where the data is naturally structured and edited as a whole: conversation messages, requirements JSON, React Flow nodes/edges.
- Mark large JSON fields in comments so later features avoid selecting them in list views.

### Required Prisma Indexes

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
- Rely on `@unique` indexes for `User.clerkId`, `User.email`, and `Requirements.projectId`.

### Research Models

- `ResearchDocument` stores Markdown research docs such as `PROJECT_RESEARCH.md`, source summaries, visual analyses, animation plans, technical comparisons, and Context7 findings.
- `ResearchAsset` stores metadata for uploaded/captured assets in Vercel Blob: screenshots, image assets, inspiration images, frame ZIPs, extracted frames, Markdown/PDF/Word/Excel/PowerPoint research files, browser captures, and extracted visual references.
- `ResearchAssetType` values are image asset, screenshot, inspiration, document, frame ZIP, frame, and scrape capture.
- `ResearchSource` stores URL-based research from manual links, Context7, Tavily, Obscura, and upload-derived references.
- `ProjectAgentSkill` stores generated `.agents/skills/<slug>/SKILL.md` content and metadata for export.
- `ExecutionPlan` stores approval-gated plans for implementation-impacting work.
- Do not store raw binary content in PostgreSQL.
- Store Blob URLs/paths, source URLs, provider names, tags, AI summaries, capture status, and timestamps.
- Research records are owned through `projectId`; all later APIs must check project ownership before read/write.

### Execution Plan Approval Records

- `ExecutionPlan` fields: `id`, `projectId`, `taskType`, `content`, `status`, `revisionNotes`, `approvedAt`, `executedAt`, timestamps.
- Status values: `PROPOSED`, `APPROVED`, `REVISION_REQUESTED`, `REJECTED`, `EXECUTED`.
- Use this model for plans that gate architecture generation, diagram generation, context/spec generation, project-specific skill generation, ZIP packaging, and coding-agent implementation.
- Passive discovery chat and research intake do not require an `ExecutionPlan`.

### Auth and Plan Enums

```prisma
enum UserPlan {
  FREE
  PRO
  ENTERPRISE
}

enum UserRole {
  USER
  ADMIN
}
```

- Do not add team, organization, project-member, owner/editor/viewer, ABAC, or audit-log tables in this feature.
- Do not enable PostgreSQL Row-Level Security in this feature. Foundrie v1 enforces ownership in the application query layer.

### Raw SQL Migration

Create a migration for PostgreSQL features Prisma cannot express directly:

```sql
CREATE INDEX CONCURRENTLY idx_diagrams_generating
ON diagrams(project_id, updated_at)
WHERE status IN ('QUEUED', 'GENERATING', 'RENDERING', 'CAPTURING');

CREATE INDEX CONCURRENTLY idx_diagrams_has_png
ON diagrams(project_id)
WHERE png_storage_url IS NOT NULL;

ALTER TABLE diagrams SET (
  autovacuum_vacuum_scale_factor = 0.01,
  autovacuum_analyze_scale_factor = 0.005,
  autovacuum_vacuum_cost_delay = 2
);

ALTER TABLE conversations SET (
  autovacuum_vacuum_scale_factor = 0.02,
  autovacuum_analyze_scale_factor = 0.01,
  autovacuum_vacuum_cost_delay = 2
);
```

- In production, create indexes with `CONCURRENTLY` to avoid table locks.
- If the initial local migration cannot run `CONCURRENTLY` inside Prisma's generated transaction, split the production index migration into a manual SQL step and document it in `prisma/README.md`.

### Prisma Clients

- Create `lib/db.ts` or `lib/prisma.ts`.
- Export `dbWrite`, `dbRead`, and `db`.
- `dbWrite` uses `DATABASE_URL`.
- `dbRead` uses `DATABASE_READ_REPLICA_URL` when present, otherwise `DATABASE_URL`.
- `db` aliases `dbWrite`.
- Cache Prisma clients on `globalThis` in development.
- Use logging: development can log query/error/warn; production logs error only.

### Transaction and Query Safety

- Add helper documentation for default isolation:
  - default read committed for normal API reads.
  - `RepeatableRead` for ZIP multi-table collection.
  - `Serializable` only for compare-then-write order allocation.
- Add comments or helper functions requiring cursor pagination for list endpoints.
- Add a query review checklist in `prisma/README.md`: no N+1, select only needed columns, no large JSON columns in lists, explain slow queries.

### Monitoring Setup Notes

- Document enabling `pg_stat_statements` in Neon.
- Add SQL snippets in `prisma/README.md` for active connections, slow queries, cache hit ratio, and dead tuple ratio.
- Add Neon parameter recommendations:
  - `statement_timeout = 30s`
  - `idle_in_transaction_session_timeout = 10s`
  - `lock_timeout = 5s`

### Migration

- Run the initial migration and generate Prisma Client.
- Verify the schema applies against Neon using the provided URI values.

## Scope Limits

- Do not implement later feature specs early.
- Do not introduce undocumented architecture changes.
- Do not bypass the storage, auth, AI, or Context7 rules in the context files.

## Check When Done

- The feature works within its defined scope.
- Relevant library docs were checked with Context7.
- Types are strict and external input is validated.
- Access control is enforced where data is read or mutated.
- Neon pooled/direct/read-replica environment variables are documented.
- Prisma datasource uses pooled `DATABASE_URL` and direct `DIRECT_URL`.
- `dbWrite`, `dbRead`, and `db` are exported.
- User schema includes `plan`, `role`, `UserPlan`, and `UserRole`.
- No team workspace, multi-role project RBAC, RLS, ABAC, or audit-log tables are added.
- All required indexes exist in Prisma or raw SQL migrations.
- ProjectAgentSkill and ExecutionPlan models exist with required indexes.
- Autovacuum tuning and monitoring SQL are documented.
- The implementation avoids alternate/generic database wording.
- `context/progress-tracker.md` is updated.
- `npm run build` passes once application code exists.
