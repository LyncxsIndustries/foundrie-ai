# High-Concurrency Patterns

**Created:** 2026-07-04  
**Related:** Feature 68, FOUNDRIE_V16.0.0  
**Full Analysis:** `ARCHITECTURE_ENHANCEMENT_ANALYSIS.md` Part 3

---

## Scaling from 10K to 10M Users

### Current Bottlenecks
1. Database connections: 100 (Neon free tier)
2. Single region: US East only
3. No caching: Every request hits DB
4. Blocking APIs: Hold function until complete

### Target Architecture

```
CloudFlare CDN (200+ edges)
    ↓
Vercel Edge (8 regions)
    ↓
Smart Query Router
    ├→ Writes: Primary DB
    └→ Reads: Nearest Replica (10x)
         ↓
    Redis Cache (95% hit rate)
```

---

## Pattern 1: Read Replica Fan-Out

```typescript
// Route reads to nearest replica
const region = process.env.VERCEL_REGION || "iad1";
const replicaUrl = REPLICAS[region] || PRIMARY_URL;

export const db = {
  // Writes → primary
  create: (...args) => dbWrite.create(...args),
  update: (...args) => dbWrite.update(...args),
  
  // Reads → replicas
  findMany: (...args) => dbRead.findMany(...args),
  findUnique: (...args) => dbRead.findUnique(...args),
};
```

**Benefit:** 10x read capacity, 90% load reduction on primary

---

## Pattern 2: Redis Cache-Aside

```typescript
async function getCachedProject(id: string) {
  // 1. Check cache
  const cached = await redis.get(`project:${id}`);
  if (cached) return cached; // ✅ Fast path
  
  // 2. Cache miss → fetch from DB
  const project = await db.findUnique({ where: { id } });
  
  // 3. Store in cache for next request
  await redis.set(`project:${id}`, project, { ex: 300 });
  
  return project;
}
```

**Benefit:** 95% of reads served in <10ms

---

## Pattern 3: Queue-Based Processing

```typescript
// BEFORE: Blocking (BAD)
export async function POST(req: Request) {
  const result = await generateDiagrams(projectId); // 2+ minutes
  return NextResponse.json(result); // User waits forever
}

// AFTER: Queue (GOOD)
export async function POST(req: Request) {
  const handle = await tasks.trigger("generate-diagrams", {
    projectId,
  });
  
  return NextResponse.json({ 
    jobId: handle.id,
    pollUrl: `/api/jobs/${handle.id}/status`
  }); // Returns in <100ms
}
```

**Benefit:** API responds instantly, handles 100K req/s

---

## Pattern 4: CDN for Static Assets

```typescript
// Upload to origin (Vercel Blob)
const blobUrl = await put(`diagrams/${id}.png`, buffer);

// Serve from CDN (200+ edges)
const cdnUrl = `https://cdn.foundrie.ai/diagrams/${id}.png`;

// Purge on update
await purgeCloudFlareCDN([cdnUrl]);
```

**Benefit:** 70% faster global load times

---

## Pattern 5: Connection Pooling

```
1000 serverless functions
    ↓
PgBouncer (transaction mode)
    ↓
100 actual Postgres connections
```

**Benefit:** Supports 10,000 concurrent users with only 100 DB connections

---

## Replica Configuration

| Region | Primary Use | Replicas |
|--------|-------------|----------|
| US | 50% traffic | 3 replicas |
| EU | 25% traffic | 2 replicas |
| Asia | 20% traffic | 2 replicas |
| LatAm | 3% traffic | 1 replica |
| Oceania | 2% traffic | 1 replica |

---

## Performance Targets

| Metric | Current | Target |
|--------|---------|--------|
| Concurrent users | 10K | 10M |
| API latency (p95) | 500ms | <100ms |
| Cache hit rate | 0% | >95% |
| Requests/second | 100 | 100K |

---

## Cost at Scale

| Users | Monthly Cost | Strategy |
|-------|--------------|----------|
| <10K | $0 | Free tiers |
| 100K | $100-500 | Add Redis + CloudFlare |
| 1M | $500-1K | Add replicas |
| 10M | $1K-5K | Kubernetes + multi-region |

---

**See `ARCHITECTURE_ENHANCEMENT_ANALYSIS.md` Part 3 for implementation details.**
