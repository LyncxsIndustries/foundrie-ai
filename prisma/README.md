# Database (Prisma 7 + Neon Postgres)

Foundrie's relational metadata layer. PostgreSQL stores ownership, relationships,
statuses, and generated text records; Vercel Blob stores large binary artifacts
(ZIPs, diagram PNGs, canvas snapshots). Never store raw binary in PostgreSQL.

## Connections

| Variable | Endpoint | Used by |
| --- | --- | --- |
| `DATABASE_URL` | pooled (`-pooler`) | Application runtime (all queries via `db`) |
| `DIRECT_URL` | direct (no pooler) | Prisma CLI only (migrate, db push, studio) |

- Prisma 7 uses a **driver adapter** (`@prisma/adapter-neon`) over the pooled
  `DATABASE_URL`. The adapter speaks to Neon over a WebSocket (port 443), which
  reuses PgBouncer connections and avoids serverless connection exhaustion.
- `prisma.config.ts` points the CLI's `datasource.url` at `DIRECT_URL`. Prisma
  Migrate needs a direct connection because PgBouncer (transaction mode) does
  not support the prepared statements migrations rely on.
- Runtime code must never use `DIRECT_URL`.

## Scripts

| Script | Command | Purpose |
| --- | --- | --- |
| `npm run db:generate` | `prisma generate` | Regenerate the typed client into `lib/generated/prisma`. Runs automatically on `postinstall`. |
| `npm run db:migrate` | `prisma migrate dev` | Create + apply a new migration in development. |
| `npm run db:push` | `prisma db push` | Push schema to the DB without a migration (prototyping only). |
| `npm run db:studio` | `prisma studio` | Open the data browser. |

### First-time setup

```bash
npm install            # also runs `prisma generate` via postinstall
npm run db:migrate     # applies prisma/migrations/** to the database
```

`prisma migrate dev` connects over **direct TCP on port 5432**.

### Networks blocking port 5432 (Cloudflare WARP)

If your network or ISP blocks outbound TCP port 5432 (common with some fiber providers due to government rules or DPI), you must tunnel your traffic to bypass the block. We use Cloudflare WARP to tunnel the connection.

#### One-time setup (Debian/Parrot OS):

```bash
# Add Cloudflare GPG key and repo
curl -fsSL https://pkg.cloudflareclient.com/pubkey.gpg | sudo gpg --yes --dearmor --output /usr/share/keyrings/cloudflare-warp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/cloudflare-warp-archive-keyring.gpg] https://pkg.cloudflareclient.com/ $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflare-client.list

# Install WARP
sudo apt-get update && sudo apt-get install cloudflare-warp

# Register and connect
warp-cli registration new
warp-cli connect

# Verify connection
curl https://www.cloudflare.com/cdn-cgi/trace | grep warp=on
```

Once connected, run your Prisma commands normally (no prefixes needed):

```bash
npm run db:generate
npm run db:push
npm run db:migrate
```

Or use `npx` for one-off commands:

```bash
npx prisma migrate reset --force
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
```

**Note:** If you use platforms like Remotasks/Outlier, turn WARP OFF before logging in, as using a data center IP may violate policy or trigger suspension.

**Neon Free tier scales the compute to zero after ~5 minutes idle.** The first
connection wakes it, and that wake can take longer than Prisma's default 5s
connect timeout — which surfaces as `P1001: Can't reach database server`. Two
fixes (use either or both):

1. Append `connect_timeout=15` to `DIRECT_URL` (and `DATABASE_URL`) in
   `.env.local` so the CLI waits for the compute to wake. This is the
   recommended permanent fix and is reflected in `.env.example`.
2. Wake the compute first: open the Neon Console and run `SELECT 1;` in the SQL
   Editor, then immediately run the Prisma command.

The application runtime is unaffected by cold starts in practice — it talks to
Neon over the serverless driver (WebSocket, port 443), and the first query wakes
the compute transparently.

### `P1001` / "server does not support SSL" — port 5432 blocked

If the timeout fix above does not help, or `psql` reports
`server does not support SSL, but SSL was required`, the network you are on is
**blocking or intercepting outbound TCP port 5432**. Neon always offers SSL, so
a "server does not support SSL" reply means something on the path (a fiber
router, ISP middlebox, or corporate firewall) answered on 5432 instead of Neon.
DNS is not the cause here — the hostname already resolved to a real Neon IP.

Diagnose by comparing two networks:

```bash
nc -vz -w 8 <your-endpoint>.region.aws.neon.tech 5432
```

Run it on the suspect network, then again on a phone hotspot. If the hotspot
behaves differently, the original network is blocking the port.

Fixes (in order of preference):

1. **Run migrations from a network that allows 5432** (e.g. a mobile hotspot).
   The migration takes seconds; the app itself never needs 5432.
2. Use a different egress (VPN/SSH tunnel) that does not block the port.

This does **not** affect the deployed app or end users — production runs over the
serverless driver on 443, and users never connect to Postgres directly.

## Production index creation (CONCURRENTLY)

`prisma migrate dev` wraps each migration in a transaction, so the performance
migration creates its partial indexes **without** `CONCURRENTLY`. On a populated
production table this takes a write lock. For zero-downtime rollouts, create the
indexes out of band instead (these cannot run inside a transaction):

```sql
CREATE INDEX CONCURRENTLY "idx_diagrams_generating" ON "Diagram" ("projectId", "updatedAt")
  WHERE "status" IN ('QUEUED', 'GENERATING', 'RENDERING', 'CAPTURING');
CREATE INDEX CONCURRENTLY "idx_diagrams_has_png" ON "Diagram" ("projectId")
  WHERE "pngStorageUrl" IS NOT NULL;
```

## Database drift and migration sync

If you encounter "Drift detected" errors (schema out of sync with migration history), you have two options:

### Option 1: Reset and replay (DESTRUCTIVE - loses all data)

Use this in development when you need a clean slate:

```bash
# Without proxy
npm run db:migrate reset --force

# With WARP enabled
npx prisma migrate reset --force
```

This drops all data and replays all migrations from scratch.

### Option 2: Manual sync (when migrations were applied out of order)

If you applied schema changes via `db push` before running migrations:

```bash
# Mark the current migration as applied without running it
npx prisma migrate resolve --applied <migration-name>

# Example:
npx prisma migrate resolve --applied 20260703083100_add_research_asset_categories
```

**When to use Option 1:** Development databases, when you need clean migration history, or when drift is complex.

**When to use Option 2:** When you manually applied a migration and just need to update the history.

## Query discipline checklist

Review every new query against this list before merging:

- [ ] Every foreign key used in a join or ownership check is indexed.
- [ ] List endpoints use **cursor pagination**, never `OFFSET`.
- [ ] List queries use `select` and do **not** pull large JSON columns
      (`Conversation.messages`, `Requirements.content`, `Diagram.reactFlowData`)
      unless the view genuinely needs them.
- [ ] No N+1 loops — use `include`/`select` relations or a single batched query.
- [ ] Every user-owned read/update/delete includes the local `user.id` in `where`.
- [ ] Queries over ~100ms are checked with `EXPLAIN ANALYZE`.

## Transaction isolation

- **Read Committed** (default) for ordinary reads and single-row writes.
- **RepeatableRead** for ZIP generation's multi-table read snapshot, so the
  package is assembled from a consistent view.
- **Serializable** only for compare-then-write order allocation (e.g. assigning
  the next `FeatureSpec.order` or `Diagram.orderInCategory`).

## Monitoring

Enable statement statistics (once per database):

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

Find the slowest statements:

```sql
SELECT mean_exec_time, calls, query
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

Cache hit ratio (target > 99%):

```sql
SELECT sum(heap_blks_hit) / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0) AS cache_hit_ratio
FROM pg_statio_user_tables;
```

## Recommended Neon session parameters

Set these to bound runaway queries and lock waits:

```sql
ALTER DATABASE neondb SET statement_timeout = '30s';
ALTER DATABASE neondb SET idle_in_transaction_session_timeout = '10s';
ALTER DATABASE neondb SET lock_timeout = '5s';
```
