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

---

### ISP/Fiber Router Blocking Port 5432 — Full Case Study & Workaround

> **Context:** This issue was encountered and fully resolved on June 15, 2026
> on a **Huawei HG8546M** GPON fiber ONT (Parrot Security OS, Safaricom/Zuku
> fiber line, Nairobi/Juja, Kenya). Documented here so it is never a mystery again.

#### What happened

The fiber ONT (router) was replaced by the ISP after the original unit failed.
The replacement unit is the **exact same hardware model**, and no code, `.env`,
schema, or router settings were changed. Migrations that worked on the old unit
started failing with `P1001: Can't reach database server` on the new one.

#### Root cause

The block is **not inside the router**. Every security page in the router admin
(`http://192.168.100.1`) was inspected and confirmed empty — no port filtering
rules, no IP filtering, no MAC filtering, no parental controls. The router
itself does nothing.

The actual blocker is the **ISP's upstream DPI (Deep Packet Inspection)
middlebox**, applied via a **TR-069 remote provisioning profile** that was pushed
to the new ONT when the ISP registered it on their network. The old ONT was
provisioned on an older, more permissive profile; the replacement received a
newer profile that includes outbound TCP port 5432 restrictions.

The block operates at the protocol level, not the IP level:

```
Your machine
    ↓  TCP SYN  (allowed — handshake completes)
ISP DPI box
    ↓  Inspects packet payload, identifies Postgres wire protocol
    ✗  RST / session reset  (Postgres never actually responds)
Neon endpoint
```

This is why `nc` can complete the TCP handshake but Prisma still gets `P1001` —
the connection is reset the moment the DPI box sees Postgres traffic on port 5432.

#### How to confirm it is the ISP (not your code or Neon)

```bash
# On fiber — this will show the TCP handshake succeed then immediately reset:
nc -vz -w 8 ep-xxxx.region.aws.neon.tech 5432

# On mobile hotspot — this will succeed cleanly:
nc -vz -w 8 ep-xxxx.region.aws.neon.tech 5432

# On fiber, IPv6 also confirms: mobile resolves to IPv6 and succeeds;
# fiber only gives a link-local fe80:: address with no public IPv6 routing:
ip -6 addr show
curl -6 -s https://ifconfig.me
```

If fiber fails and mobile succeeds, the ISP is blocking the port. Your code is
fine. Neon is fine. Nothing on your machine needs changing.

#### Permanent fix — call the ISP

Tell support:
> *"My previous ONT allowed outbound TCP port 5432. The replacement unit is
> blocking it. Please update my line's service profile to match the old
> provisioning, or whitelist outbound port 5432."*

The ISP can push a new TR-069 config to the ONT remotely in minutes without
sending a technician. This is the cleanest fix and requires zero code changes.

#### Immediate workaround — Cloudflare WARP

Since the ISP's upstream provider uses DPI to block Postgres traffic, we tunnel all traffic using Cloudflare WARP. This encrypts the traffic and bypasses the DPI rules.

**One-time setup (Debian/Parrot OS):**

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

**Run Prisma commands normally:**

Because WARP works at the system level, you no longer need any special prefixes (`proxychains4`) or helper scripts. Just run commands as usual:

```bash
npm run db:generate
npm run db:push
npm run db:migrate
npm run db:studio
```

> **Warning for Remote Workers:** Cloudflare WARP routes your traffic through a data center. If you log into strict remote work platforms (like Remotasks or Outlier) while WARP is on, it may violate policy or trigger suspension for using a proxy/VPN. Always turn WARP off before accessing those platforms.

#### Why `prisma.config.ts` matters here

Prisma 7 reads connection strings from `prisma.config.ts`, not from `schema.prisma`.
The `datasource` block in `schema.prisma` deliberately has no `url` or
`directUrl` fields — the config file wires those up. `prisma migrate dev` and
`prisma db push` both use `DIRECT_URL` (direct TCP port 5432) because PgBouncer
transaction mode does not support the prepared statements that migrations rely
on. This means the pooler URL (`DATABASE_URL`, port 443 WebSocket) cannot be
substituted for CLI operations — the tunnel is the correct fix.

#### What does NOT fix it

| Attempted fix | Why it does not work |
|---|---|
| Changing router firewall rules | Block is upstream at ISP, not in the router |
| Disabling router DoS/filtering | Same reason — router rules are irrelevant |
| Switching to pooler URL for migrations | PgBouncer transaction mode breaks prepared statements; `prisma migrate dev` will error |
| IPv6 (on this ISP/line) | ISP does not provision IPv6 on fiber; only link-local `fe80::` addresses are assigned |
| Changing `connect_timeout` | Timeout helps with Neon cold starts, not with port blocks |

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
