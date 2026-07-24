# Library Documentation

## Contract Synchronization Gate

Any implementation change that corrects or changes a contract must be reflected in the same branch across the affected feature spec, dependent future specs, relevant context files, root AGENTS.md, and progress-tracker.md. Contracts include Prisma fields and relations, route signatures, auth helper signatures, AI task names and callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, and file ownership. A feature is not ready for review while later specs or context still describe stale fields, old API shapes, or invalid contracts.

## Purpose

This document provides project-specific integration patterns for third-party libraries used in Foundrie AI. For general library documentation, use Context7. This file covers only Foundrie-specific usage patterns, configuration, and common pitfalls.

---

## Cloudinary (Media Storage)

### Installation

```bash
npm install next-cloudinary cloudinary
```

### Environment Variables

```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

> **CRITICAL: Roles & Permissions**
> For Cloudinary accounts created after May 2026, API Keys default to having no permissions. You MUST assign the **Media Developer** role (or another role with the `create` permission) to the API Key in the Cloudinary Console (Settings -> Access Keys -> Edit Key -> Assigned Roles) to prevent `403 Forbidden` errors during uploads.

### Upload Preset Configuration

In Cloudinary dashboard, create upload preset `foundrie_discovery`:
- Signing Mode: Signed
- Folder: `foundrie/{projectId}`
- Allowed formats: jpg, png, webp, svg, gif, mp4, webm, mov, pdf, txt, md, doc, docx, ppt, pptx
- Max file size: 100MB
- Transformations: Auto format, auto quality

### Server-Side Upload Helper

**Location:** `lib/media/cloudinary.ts`

```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function generateSignedUploadUrl(projectId: string) {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const folder = `foundrie/${projectId}`;

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder,
      upload_preset: 'foundrie_discovery',
    },
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    folder,
  };
}

export async function deleteCloudinaryAsset(publicId: string) {
  try {
    await cloudinary.uploader.destroy(publicId);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete Cloudinary asset:', error);
    return { success: false, error };
  }
}

export async function downloadCloudinaryAsset(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
```

### Client-Side Upload Component

**Location:** `components/discovery/FileUploadZone.tsx`

```typescript
'use client';

import { CldUploadWidget } from 'next-cloudinary';
import { useState } from 'react';
import { toast } from 'sonner';

interface FileUploadZoneProps {
  projectId: string;
  onUploadSuccess?: (file: any) => void;
}

export function FileUploadZone({ projectId, onUploadSuccess }: FileUploadZoneProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleSuccess = async (result: any) => {
    setIsUploading(false);

    // Save metadata to database
    const response = await fetch(`/api/projects/${projectId}/research/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cloudinaryPublicId: result.public_id,
        cloudinaryUrl: result.secure_url,
        format: result.format,
        fileType: getFileType(result.resource_type),
        fileName: result.original_filename,
        fileSize: result.bytes,
      }),
    });

    const file = await response.json();
    onUploadSuccess?.(file);
    toast.success('File uploaded successfully');
  };

  return (
    <CldUploadWidget
      uploadPreset="foundrie_discovery"
      onSuccess={handleSuccess}
      onQueuesEnd={() => setIsUploading(false)}
      onQueuesStart={() => setIsUploading(true)}
      options={{
        maxFileSize: 100000000, // 100MB
        maxFiles: 10,
        multiple: true,
        sources: ['local', 'url', 'camera'],
        folder: `foundrie/${projectId}`,
        clientAllowedFormats: ['jpg', 'png', 'webp', 'svg', 'gif', 'mp4', 'webm', 'mov', 'pdf', 'txt', 'md', 'doc', 'docx', 'ppt', 'pptx'],
      }}
    >
      {({ open }) => (
        <button
          onClick={() => open()}
          disabled={isUploading}
          className="btn-upload"
        >
          {isUploading ? 'Uploading...' : 'Upload Files'}
        </button>
      )}
    </CldUploadWidget>
  );
}

function getFileType(resourceType: string): string {
  if (resourceType === 'image') return 'image';
  if (resourceType === 'video') return 'video';
  return 'document';
}
```

### Image Optimization

```tsx
import { CldImage } from 'next-cloudinary';

// Automatic optimization
<CldImage
  src={file.cloudinaryPublicId}
  width={400}
  height={300}
  alt={file.fileName}
  crop="fill"
  gravity="auto"
/>

// Responsive sizes
<CldImage
  src={file.cloudinaryPublicId}
  width={1200}
  height={800}
  alt={file.fileName}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

---

## GSAP (Animations)

### Installation

```bash
npm install gsap @gsap/react
```

### License

Foundrie uses GSAP Business License for ScrollTrigger and advanced plugins. License key configured in `lib/gsap-config.ts`.

### Basic Setup

**Location:** `lib/gsap-config.ts`

```typescript
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export { gsap, ScrollTrigger, useGSAP };
```

### Common Patterns

**Button Press Animation:**

```typescript
import { useRef } from 'react';
import { gsap } from '@/lib/gsap-config';

export function AnimatedButton() {
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={buttonRef}
      onPointerDown={() => {
        gsap.to(buttonRef.current, {
          scale: 0.95,
          duration: 0.1,
          ease: 'power2.out',
        });
      }}
      onPointerUp={() => {
        gsap.to(buttonRef.current, {
          scale: 1,
          duration: 0.2,
          ease: 'back.out(1.7)',
        });
      }}
    >
      Click me
    </button>
  );
}
```

**Scroll-Triggered Reveal:**

```typescript
import { useRef } from 'react';
import { useGSAP } from '@/lib/gsap-config';
import { gsap } from 'gsap';

export function ScrollReveal({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(containerRef.current, {
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play none none reverse',
      },
      y: 60,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
    });
  }, { scope: containerRef });

  return <div ref={containerRef}>{children}</div>;
}
```

**Stagger Animation:**

```typescript
useGSAP(() => {
  gsap.from('.card', {
    scrollTrigger: {
      trigger: '.cards-container',
      start: 'top 80%',
    },
    y: 60,
    opacity: 0,
    duration: 0.8,
    stagger: 0.15, // Delay between each card
    ease: 'power3.out',
  });
}, []);
```

**Hover Magnetic Effect:**

```typescript
export function MagneticButton({ children }: { children: React.ReactNode }) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    gsap.to(button, {
      x: x * 0.3,
      y: y * 0.3,
      duration: 0.3,
      ease: 'power2.out',
    });
  };

  const handleMouseLeave = () => {
    gsap.to(buttonRef.current, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: 'elastic.out(1, 0.5)',
    });
  };

  return (
    <button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </button>
  );
}
```

---

## React Flow (@xyflow/react)

### Installation

```bash
npm install @xyflow/react
```

### Basic Setup

```typescript
'use client';

import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

export function DiagramCanvas({ nodes, edges, onNodesChange, onEdgesChange }) {
  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        className="bg-background"
      >
        <Background color="#2a2a2a" gap={16} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
```

### Custom Node Types

```typescript
import { Node, NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';

export function SystemNode({ data }: NodeProps) {
  return (
    <div className="px-4 py-2 rounded-lg bg-surface border border-border">
      <Handle type="target" position={Position.Top} />
      <div className="font-semibold">{data.label}</div>
      <div className="text-sm text-secondary">{data.description}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

// Register custom nodes
const nodeTypes = {
  system: SystemNode,
};

<ReactFlow nodes={nodes} nodeTypes={nodeTypes} ... />
```

---

## Liveblocks (Realtime Collaboration)

### Installation

```bash
npm install @liveblocks/client @liveblocks/react
```

### Setup

**Location:** `lib/liveblocks.ts`

```typescript
import { createClient } from '@liveblocks/client';
import { createRoomContext } from '@liveblocks/react';

const client = createClient({
  authEndpoint: '/api/liveblocks/auth',
});

export const {
  RoomProvider,
  useOthers,
  useSelf,
  useMyPresence,
  useUpdateMyPresence,
} = createRoomContext(client);
```

**Auth Endpoint:** `app/api/liveblocks/auth/route.ts`

```typescript
import { Liveblocks } from '@liveblocks/node';
import { requireAuth } from '@/lib/auth/require-auth';

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(req: Request) {
  const user = await requireAuth(req);
  const { room } = await req.json();

  // Verify user has access to this project/room
  // ... access control logic ...

  const session = liveblocks.prepareSession(user.id, {
    userInfo: {
      name: user.name,
      email: user.email,
    },
  });

  session.allow(room, session.FULL_ACCESS);

  const { status, body } = await session.authorize();
  return new Response(body, { status });
}
```

**Usage in Canvas:**

```typescript
'use client';

import { RoomProvider, useOthers } from '@/lib/liveblocks';

export function CollaborativeCanvas({ projectId, children }) {
  return (
    <RoomProvider id={`project-${projectId}`} initialPresence={{ cursor: null }}>
      <Cursors />
      {children}
    </RoomProvider>
  );
}

function Cursors() {
  const others = useOthers();

  return (
    <>
      {others.map(({ connectionId, presence }) => {
        if (!presence.cursor) return null;

        return (
          <div
            key={connectionId}
            style={{
              position: 'absolute',
              left: presence.cursor.x,
              top: presence.cursor.y,
              pointerEvents: 'none',
            }}
          >
            <div className="w-4 h-4 bg-primary rounded-full" />
          </div>
        );
      })}
    </>
  );
}
```

---

## Prisma (Database ORM)

### Useful Patterns

**Nested Includes:**

```typescript
const project = await db.project.findUnique({
  where: { id: projectId },
  include: {
    owner: true,
    collaborators: true,
    researchFiles: {
      orderBy: { createdAt: 'desc' },
      take: 10,
    },
  },
});
```

**Transactions:**

```typescript
const result = await db.$transaction(async (tx) => {
  const project = await tx.project.create({ data: projectData });
  await tx.researchFile.createMany({
    data: files.map((f) => ({ ...f, projectId: project.id })),
  });
  return project;
});
```

**Soft Deletes:**

```typescript
// Instead of delete, mark as deleted
await db.project.update({
  where: { id: projectId },
  data: { deletedAt: new Date() },
});

// Filter out soft-deleted in queries
const projects = await db.project.findMany({
  where: { userId, deletedAt: null },
});
```

---

## Trigger.dev (Background Jobs)

### Job Pattern

**Location:** `trigger/zip-generation.ts`

```typescript
import { task } from '@trigger.dev/sdk/v3';

export const generateZip = task({
  id: 'generate-zip',
  run: async (payload: { projectId: string }) => {
    const project = await db.project.findUnique({
      where: { id: payload.projectId },
      include: { researchFiles: true },
    });

    // 1. Generate context files
    await logger.info('Generating context files...');
    const contextFiles = await generateContextFiles(project);

    // 2. Generate feature specs
    await logger.info('Generating feature specs...');
    const specs = await generateFeatureSpecs(project);

    // 3. Download Cloudinary media
    await logger.info('Downloading media files...');
    const mediaFiles = await downloadMediaFiles(project.researchFiles);

    // 4. Create ZIP
    await logger.info('Creating ZIP...');
    const zipBuffer = await createZip({
      contextFiles,
      specs,
      mediaFiles,
    });

    // 5. Upload to Vercel Blob
    await logger.info('Uploading ZIP...');
    const blob = await put(`${project.slug}_${Date.now()}.zip`, zipBuffer, {
      access: 'public',
    });

    // 6. Save metadata
    await db.project.update({
      where: { id: project.id },
      data: { zipUrl: blob.url },
    });

    return { zipUrl: blob.url };
  },
});
```

---

## Zod (Schema Validation)

### API Route Validation

```typescript
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  complexity: z.enum(['SIMPLE', 'STANDARD', 'COMPLEX']),
});

export async function POST(req: Request) {
  const body = await req.json();
  
  const result = createProjectSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { error: result.error.issues },
      { status: 400 }
    );
  }

  const project = await db.project.create({
    data: result.data,
  });

  return Response.json(project);
}
```

---

## PostHog (Product Analytics)

### Context7 Library ID
- Client (browser): `/posthog/posthog-js` — use this ID for all `ctx7 library` / `ctx7 docs` lookups covering `before_send`, `identify`, `reset`, capture events, init config.
- Server (Node): `/posthog/posthog-node` — distinct SDK for server-side telemetry (Route Handlers, Trigger.dev tasks). Client-side patterns do not apply.

### Installation & Versions (project-pinned)
```
posthog-js@^1.300.0     # browser — instrumentation-client.ts
posthog-node@^5.15.0    # Node    — lib/posthog-server.ts, server-only
```

### Environment Variables
```
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN    # required — Feature 56 guard throws on missing
NEXT_PUBLIC_POSTHOG_HOST             # required — Feature 56 guard throws on missing
POSTHOG_API_KEY                      # server-side (posthog-node), Optional in dev.
```
Server-only env vars (POSTHOG_* without NEXT_PUBLIC_) are never exposed to the browser bundle.

### Client-Side Integration Pattern (REQUIRED BY SPECS 56 + 57)
**File**: `instrumentation-client.ts` (imported by Next.js via `experimental.instrumentationHook = true` and an `instrumentation.ts` barrel that re-exports only when `process.env.NEXT_RUNTIME === "node"` is FALSE — the file is browser-scoped by the runtime check inside).

**Global scrubbing pattern (Feature 57) — CANNOT be weakened**:
```typescript
posthog.init(projectToken, {
  api_host: host,
  defaults: "2026-01-30",
  capture_exceptions: true,
  debug: false,
  disable_external_dependency_loading: false,
  before_send: (event) => {
    if (!event) return null;
    event.properties = {};
    event.$set = {};
    event.$set_once = {};
    return event;
  },
});
```

**CaptureResult envelope (from Context7 /posthog/posthog-js types)**:
- `event.properties` — event-level fields: `$current_url`, `$pathname`, `$browser`, `$os`, `$geoip_*`, UTM params, `$referrer`, `$screen`, any custom props. **All scrubbed to `{}` by Feature 57.**
- `event.$set` — person properties written by `posthog.identify()` (email, name). **Scrubbed to `{}` by Feature 57.**
- `event.$set_once` — first-seen-only person props (`$initial_utm_*`, `$initial_referrer`). **Scrubbed to `{}` by Feature 57.**
- `event.uuid`, `event.event`, `event.timestamp` — retained; contain no PII.
- `before_send` runs after the SDK builds the full envelope. Return `null` to drop an event (not used in this spec; Feature 57 only scrubs). Returning a mutated `CaptureResult` continues the event.

**Defense-in-depth layering across specs**:
| Layer | Spec     | Scope                                 | Mechanism                                |
|-------|----------|---------------------------------------|------------------------------------------|
| 1     | 60       | identify() call site                  | No email/name passed in person props     |
| 2     | 57       | every browser event (wire payload)    | `before_send` wipes properties/$set/$s_o |
| 3     | 59       | signed-out provider mount boundary    | `posthog.reset()` clears in-memory state |

**Exceptions captured by `capture_exceptions: true`**: also routed through `before_send`. Stack traces, file paths, and query strings that would leak into exception properties are all removed by the blanket `properties = {}` wipe. No separate exception scrubbing hook is required.

**Validation in dev**: In Chrome DevTools → Network, filter by `/e/` (the PostHog ingest endpoint). Body JSON MUST have `properties: {}`, `$set: {}`, `$set_once: {}`. Any non-empty value on those three fields means the before_send hook is NOT applied and is a PII-leak regression.

### Server-Side Integration Pattern
**File**: `lib/posthog-server.ts` — uses `posthog-node`. Server events are NOT filtered by the client-side `before_send` (different SDKs). Keep server payloads minimal and PII-free by construction.

---

## Summary

- **Cloudinary**: Use signed uploads, save metadata to DB, download for ZIP export
- **GSAP**: Use useGSAP hook, cleanup is automatic, prefer power/back easing
- **React Flow**: Custom nodes, Liveblocks integration for realtime
- **Liveblocks**: Room-based auth, presence for cursors, storage for canvas state
- **Prisma**: Include relations, transactions for multi-table ops, soft deletes
- **Trigger.dev**: Durable tasks for long-running jobs, structured logging
- **Zod**: Validate all API inputs, use safeParse for graceful errors
- **PostHog**: Client `before_send` 3-field scrub (spec 57) + identify scrub (spec 60) + sign-out reset (spec 59); Context7 IDs `/posthog/posthog-js` and `/posthog/posthog-node`
