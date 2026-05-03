# Foundrie AI - Prisma & Neon Postgres Setup

This guide provides instructions for managing the Prisma database schema, generating clients, and performing necessary database tuning for Foundrie AI on Neon Postgres.

## Initial Setup

1. Request or generate your Neon API keys.
2. Populate `.env.local` with your Neon connection strings:
   - `DATABASE_URL` (Must use the `-pooler` endpoint)
   - `DIRECT_URL` (Direct connection URL)

## Database Scripts

Run these scripts from the project root:

- `npm run db:generate` - Generates the Prisma Client.
- `npm run db:migrate` - Runs migrations against the Neon direct URL.
- `npm run db:push` - Syncs schema without a migration file.
- `npm run db:studio` - Opens Prisma Studio locally.

## Raw SQL Migrations & Tuning

Prisma does not support `CONCURRENTLY` indexes or table-level `autovacuum` parameters directly in the `schema.prisma`. 
After running `npm run db:migrate`, execute the following SQL commands manually against your Neon database:

### Partial Indexes

```sql
CREATE INDEX CONCURRENTLY idx_diagrams_generating
ON "Diagram"("projectId", "updatedAt")
WHERE status IN ('QUEUED', 'GENERATING', 'RENDERING', 'CAPTURING');

CREATE INDEX CONCURRENTLY idx_diagrams_has_png
ON "Diagram"("projectId")
WHERE "pngStorageUrl" IS NOT NULL;
```

### Autovacuum Tuning

```sql
ALTER TABLE "Diagram" SET (
  autovacuum_vacuum_scale_factor = 0.01,
  autovacuum_analyze_scale_factor = 0.005,
  autovacuum_vacuum_cost_delay = 2
);

ALTER TABLE "Conversation" SET (
  autovacuum_vacuum_scale_factor = 0.02,
  autovacuum_analyze_scale_factor = 0.01,
  autovacuum_vacuum_cost_delay = 2
);
```

## Monitoring & Neon Parameter Recommendations

Enable `pg_stat_statements` in Neon to monitor queries.

**Recommended Neon settings:**
- `statement_timeout = 30s`
- `idle_in_transaction_session_timeout = 10s`
- `lock_timeout = 5s`

### Useful SQL Snippets

**Active Connections:**
```sql
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

**Slow Queries:**
```sql
SELECT query, calls, total_exec_time, mean_exec_time
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

**Cache Hit Ratio:**
```sql
SELECT
  sum(heap_blks_read) as heap_read,
  sum(heap_blks_hit)  as heap_hit,
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
FROM pg_statio_user_tables;
```

## Query Review Checklist

Before committing query changes, ensure:
- [ ] No N+1 queries.
- [ ] `select` is used to fetch only needed columns.
- [ ] Large JSON columns (`reactFlowNodes`, `reactFlowEdges`, `messages`) are excluded from list views.
- [ ] Slow queries (>100ms) are analyzed using `EXPLAIN ANALYZE`.
- [ ] Read-heavy flows use `db`.
- [ ] Dashboard and lists use cursor pagination.
