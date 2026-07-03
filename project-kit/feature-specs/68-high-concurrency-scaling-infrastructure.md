# Feature 68: High-Concurrency Scaling Infrastructure

**Status:** Not Started  
**Priority:** P1 (Before Growth)  
**Dependencies:** Features 65-67  
**Assigned To:** AI Agent  
**Estimated Effort:** 7 days

---

## Problem Statement

### Current Capacity Limits

**Maximum Concurrent Users:** ~10,000 (estimated)  
**Target:** 10,000,000 concurrent users (1000x increase)

**Bottlenecks:**
1. Database connections (Neon free tier: 100 max)
2. Vercel serverless limits (1,000 concurrent functions on Pro)
3. Single region deployment (US East only)
4. No caching layer (every request hits database)
5. No read replicas (all queries hit primary)
6. Blocking API routes (hold function until complete)

### Impact

- App crashes under viral load
- Slow response times for global users (400ms+ latency from Asia)
- Database connection pool exhaustion
- Cannot scale beyond 10K concurrent users

---

## Solution Overview

Implement multi-region, multi-tier scaling architecture:

1. **Multi-Region Edge Deployment** - 8 global regions
2. **Read Replicas** - 10x replicas across 3 continents
3. **Redis Caching Layer** - 95% of reads from cache
4. **Queue-Based Processing** - Async background jobs
5. **CDN for Static Assets** - CloudFlare global edge
6. **Smart Query Router** - Writes → primary, reads → replicas

**Result:** Handle 10M concurrent users with <100ms API response (p95)

---

## Technical Design

### 1. Multi-Region Vercel Deployment

```json
// vercel.json
{
  "regions": [
    "iad1",  // US East (Virginia)
    "sfo1",  // US West (San Francisco)
    "lhr1",  // Europe West (London)
    "fra1",  // Europe Central (Frankfurt)
    "hnd1",  // Asia East (Tokyo)
    "sin1",  // Asia Southeast (Singapore)
    "gru1",  // South America (São Paulo)
    "syd1"   // Oceania (Sydney)
  ],
  "framework": {
    "name": "nextjs"
  }
}
```

**Benefit:** Users routed to nearest region, 60-80% latency reduction

### 2. Neon Read Replicas Configuration

```typescript
// lib/db/index.ts (ENHANCED)
import { PrismaClient } from "@prisma/client";

// Primary database (write operations)
const dbWrite = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL_PRIMARY },
  },
  log: ["error", "warn"],
});

// Read replica router (region-aware)
function getReadReplicaForRegion(region: string): string {
  const replicas = {
    // US replicas (3x)
    iad1: process.env.DATABASE_URL_REPLICA_US_EAST_1!,
    sfo1: process.env.DATABASE_URL_REPLICA_US_WEST_1!,
    dfw1: process.env.DATABASE_URL_REPLICA_US_CENTRAL_1!,
    
    // EU replicas (2x)
    lhr1: process.env.DATABASE_URL_REPLICA_EU_WEST_1!,
    fra1: process.env.DATABASE_URL_REPLICA_EU_CENTRAL_1!,
    
    // Asia replicas (2x)
    hnd1: process.env.DATABASE_URL_REPLICA_ASIA_EAST_1!,
    sin1: process.env.DATABASE_URL_REPLICA_ASIA_SOUTHEAST_1!,
    
    // LatAm replica (1x)
    gru1: process.env.DATABASE_URL_REPLICA_LATAM_1!,
    
    // Oceania replica (1x)
    syd1: process.env.DATABASE_URL_REPLICA_OCEANIA_1!,
  };

  return replicas[region] || process.env.DATABASE_URL!; // Fallback to primary
}

const region = process.env.VERCEL_REGION || "iad1";
const readReplicaUrl = getReadReplicaForRegion(region);

const dbRead = new PrismaClient({
  datasources: {
    db: { url: readReplicaUrl },
  },
  log: ["error"],
});

// Smart query router
export const db = {
  // Write operations → primary
  create: (...args) => dbWrite.create(...args),
  update: (...args) => dbWrite.update(...args),
  delete: (...args) => dbWrite.delete(...args),
  upsert: (...args) => dbWrite.upsert(...args),
  createMany: (...args) => dbWrite.createMany(...args),
  updateMany: (...args) => dbWrite.updateMany(...args),
  deleteMany: (...args) => dbWrite.deleteMany(...args),

  // Read operations → replicas
  findUnique: (...args) => dbRead.findUnique(...args),
  findMany: (...args) => dbRead.findMany(...args),
  findFirst: (...args) => dbRead.findFirst(...args),
  count: (...args) => dbRead.count(...args),
  aggregate: (...args) => dbRead.aggregate(...args),
  groupBy: (...args) => dbRead.groupBy(...args),

  // Transactions → primary
  $transaction: (...args) => dbWrite.$transaction(...args),
  $queryRaw: (...args) => dbWrite.$queryRaw(...args),
  $executeRaw: (...args) => dbWrite.$executeRaw(...args),
};
```

### 3. Upstash Redis Caching Layer

```typescript
// lib/cache/redis.ts
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache wrapper with automatic invalidation
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  // Check cache
  const cached = await redis.get<T>(key);
  if (cached) return cached;

  // Fetch fresh data
  const data = await fetcher();

  // Store in cache
  await redis.set(key, data, { ex: ttlSeconds });

  return data;
}

// Specific cache functions
export async function getCachedProject(projectId: string) {
  return withCache(
    `project:${projectId}`,
    300, // 5 min TTL
    async () => {
      return db.findUnique({
        where: { id: projectId },
        include: { diagrams: true, members: true },
      });
    }
  );
}

export async function getCachedUserRole(userId: string, projectId: string) {
  return withCache(
    `role:${userId}:${projectId}`,
    600, // 10 min TTL
    async () => {
      const member = await db.findUnique({
        where: { userId_projectId: { userId, projectId } },
      });
      return member?.role || null;
    }
  );
}

// Cache invalidation
export async function invalidateProject(projectId: string) {
  await redis.del(`project:${projectId}`);
}

export async function invalidateUserRole(userId: string, projectId: string) {
  await redis.del(`role:${userId}:${projectId}`);
}
```

### 4. Queue-Based Async Processing

```typescript
// app/api/diagrams/[projectId]/generate/route.ts (BEFORE - SLOW)
export async function POST(req: Request) {
  const { projectId } = await params;
  
  // ❌ Blocks for 2+ minutes while diagrams generate
  const diagrams = await generateAllDiagrams(projectId);
  
  return NextResponse.json(diagrams); // User waits forever
}

// AFTER (FAST)
export async function POST(req: Request) {
  const { projectId } = await params;
  
  // ✅ Returns immediately (<100ms)
  const handle = await tasks.trigger("generate-diagrams-batch", {
    projectId,
  });
  
  return NextResponse.json({ 
    jobId: handle.id,
    status: "QUEUED",
    pollUrl: `/api/jobs/${handle.id}/status`
  });
}

// Client polls for completion
// components/diagram-generator.tsx
async function generateDiagrams() {
  const response = await fetch(`/api/diagrams/${projectId}/generate`, {
    method: "POST",
  });
  
  const { jobId, pollUrl } = await response.json();
  
  // Poll every 2 seconds
  const interval = setInterval(async () => {
    const status = await fetch(pollUrl).then(r => r.json());
    
    if (status.status === "COMPLETED") {
      clearInterval(interval);
      setDiagrams(status.result);
    }
    
    if (status.status === "FAILED") {
      clearInterval(interval);
      setError(status.error);
    }
  }, 2000);
}
```

### 5. CloudFlare CDN Configuration

```typescript
// lib/storage/cdn.ts
import { put } from "@vercel/blob";

export async function uploadDiagramWithCDN(
  projectId: string,
  diagramId: string,
  buffer: Buffer
): Promise<string> {
  // 1. Upload to Vercel Blob (origin)
  const blobUrl = await put(
    `diagrams/${projectId}/${diagramId}.png`,
    buffer,
    { access: "public" }
  );

  // 2. CloudFlare automatically caches from Vercel Blob
  const cdnUrl = `https://cdn.foundrie.ai/diagrams/${projectId}/${diagramId}.png`;

  // 3. Purge CDN cache when diagram updates
  await purgeCloudFlareCDN([cdnUrl]);

  return cdnUrl; // Served from 200+ edge locations globally
}

async function purgeCloudFlareCDN(urls: string[]) {
  await fetch(`https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/purge_cache`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ files: urls }),
  });
}
```

---

## Acceptance Criteria

- [ ] Multi-region deployment configured (8 regions)
- [ ] Read replicas set up (10x: 3 US, 2 EU, 2 Asia, 1 LatAm, 1 Oceania, 1 spare)
- [ ] Redis caching layer operational
- [ ] 95% of project reads served from cache
- [ ] API responds in <100ms (p95) globally
- [ ] Handles 100K requests/second without degradation
- [ ] Zero database connection pool exhaustion
- [ ] Long-running operations queued (diagram gen, ZIP build)
- [ ] CDN configured for diagrams and static assets
- [ ] Load test passes: 10K concurrent users, <100ms p95 latency

---

## Files Owned

### New Files
- `lib/db/replicas.ts`
- `lib/cache/redis.ts`
- `lib/storage/cdn.ts`
- `vercel.json` (update)

### Modified Files
- `lib/db/index.ts` (add smart query router)
- `app/api/diagrams/[projectId]/generate/route.ts` (async queue)
- `.env.example` (add replica URLs, Redis, CloudFlare)

---

## Testing Requirements

- Load test: 10K concurrent users with k6
- Measure p50/p95/p99 latencies per region
- Verify cache hit rate >95%
- Test replica failover (kill primary → reads still work)
- Chaos test: kill random replica → verify graceful degradation

---

## Out of Scope

- ❌ Database sharding (only needed at 10M+ projects)
- ❌ Multi-region active-active writes
- ❌ Custom CDN (using CloudFlare)

---

## External Services Setup

### Neon Read Replicas
1. Go to Neon dashboard → Project → Branches
2. For each region, create read replica:
   - US East: `neonctl branches create --name replica-us-east-1 --type read-replica`
   - US West: `neonctl branches create --name replica-us-west-1 --type read-replica`
   - (Repeat for all 10 regions)
3. Copy connection strings to `.env`:
   ```
   DATABASE_URL_REPLICA_US_EAST_1=postgresql://...
   DATABASE_URL_REPLICA_US_WEST_1=postgresql://...
   # ... (10 total)
   ```

### Upstash Redis
1. Create account at https://upstash.com
2. Create database → Select global replication
3. Copy REST URL and token to `.env`:
   ```
   UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=xxx
   ```

### CloudFlare CDN
1. Add domain to CloudFlare
2. Go to DNS → Add CNAME: `cdn` → Vercel Blob URL
3. Create API token (Zone → Cache Purge permission)
4. Add to `.env`:
   ```
   CLOUDFLARE_ZONE_ID=xxx
   CLOUDFLARE_API_TOKEN=xxx
   ```

---

**END OF SPEC**
