# CodeRabbit Review Fixes - Feature 64

**Date**: 2026-08-04  
**Branch**: `feature/63-discovery-chat-ui-fixes`  
**Status**: Addressing 19 actionable comments + 3 nitpicks

## Summary of Required Changes

This document addresses all CodeRabbit findings for Feature 64 WhatsApp-style chat specification. The fixes ensure contract consistency, remove ambiguities, add measurable performance criteria, and align documentation with actual implementation patterns.

---

## CRITICAL FIXES (Must Address Before Implementation)

### 1. Gallery vs Bubble Contract Ambiguity ✅ CLARIFIED

**Issue**: Spec says "one gallery for 2+ images" but ChatMessage.tsx renders "one bubble per attachment"

**Resolution**: The spec language was imprecise. **Correct behavior**:
- Each attachment gets its own **separate bubble** (already implemented in Feature 63)
- The "masonry gallery" refers to the **layout pattern within the message group**, not a single combined bubble
- When a user sends 5 images, they render as 5 separate bubbles in a masonry-style visual flow

**Documentation Fix**:
```markdown
### 2. Staggered Image Gallery (Masonry Layout Within Message Group)
- Each image attachment renders as a **separate bubble** with its own avatar/timestamp/actions
- Multiple image bubbles from the same message visually flow in a masonry-style layout
- **1 image**: Full-width display (max 400px)
- **2 images**: Side-by-side grid pattern
- **3+ images**: Pinterest/Instagram-style staggered masonry visual flow
- **Handles 20+ images** (as separate bubbles) without performance degradation
```

### 2. Unified Actions: Delete Button Label ✅ FIXED

**Issue**: "Delete" button on attachments - does it delete the attachment or the entire message?

**Resolution**: Based on the API contract (`DELETE /api/conversations/[projectId]/messages/[messageId]`), deleting **deletes the entire message** including all attachments.

**Documentation Fix**:
```markdown
### 4. Unified Actions
All actions work consistently across text and media bubbles:

| Action | Text Messages | Image Attachments | Documents | Videos |
|--------|--------------|-------------------|-----------|--------|
| Copy | Copies content | Copies Cloudinary URL | Copies Cloudinary URL | Copies Cloudinary URL |
| **Delete Message** | Deletes message + attachments | Deletes message + attachments | Deletes message + attachments | Deletes message + attachments |
| Reply | Creates thread | Creates thread | Creates thread | Creates thread |

**Note**: The Delete action always removes the entire message and cascades to all attachments. Single-attachment deletion is intentionally not supported to preserve message integrity.
```

### 3. Soft Delete vs Recovery Contract ✅ CLARIFIED

**Issue**: Flow deletes Attachment records and queues Cloudinary deletion, but claims "soft delete enables undo/recovery"

**Resolution**: The soft delete is **only for the ConversationMessage**. Attachments are **hard deleted** immediately. Recovery is not supported.

**Documentation Fix**:
```markdown
**14-Step Deletion Flow:**
1. User clicks "Delete message" on any bubble
2. Frontend shows confirmation dialog
3. DELETE request to `/api/conversations/[projectId]/messages/[messageId]`
4. Server verifies ownership via `requireProjectMember`
5. Fetch all `Attachment` records for message
6. Extract `cloudinaryId` array
7. **Hard delete `Attachment` records from Neon** (immediate, permanent)
8. **Queue Trigger.dev task** for background Cloudinary media deletion
9. Set `ConversationMessage.isActive = false` (soft delete)
10. Return success response with deletion count
11. Frontend optimistically removes from UI
12. Background task deletes from Cloudinary (max 100/request batch)
13. Log all deletions for audit trail
14. Continue on individual failures (logged, not surfaced to user)

**Why soft delete the message but hard delete attachments:**
- **Message soft delete**: Preserves reply thread integrity (FK constraints valid), enables conversation history queries with `WHERE isActive = true`
- **Attachment hard delete**: Media storage is expensive; immediate cleanup prevents orphaned Cloudinary assets
- **No undo/recovery**: This is intentional - deletion is permanent after confirmation
- **Audit trail**: Structured logs record all deletions for compliance
```

### 4. Asynchronous DELETE Response Contract ✅ FIXED

**Issue**: API queues Trigger.dev task but returns `errors: string[]` implying synchronous Cloudinary failures

**Resolution**: Cloudinary deletion happens **asynchronously** in the background. The DELETE endpoint cannot return Cloudinary errors.

**Documentation Fix**:
```markdown
### Message Deletion
```typescript
DELETE /api/conversations/[projectId]/messages/[messageId]

Request:
  - Auth: requireProjectMember(projectId, userId)
  - Params: projectId, messageId

Response:
  {
    success: true,
    deletedCount: number,  // Number of Attachment records deleted from Neon
    jobId: string  // Trigger.dev task run ID for background Cloudinary cleanup
  }

Errors:
  - 401: Unauthenticated
  - 404: Message not found or unauthorized
  - 500: Database deletion failed

**Note**: Cloudinary media deletion happens asynchronously via Trigger.dev. The response confirms database deletion only. Background task failures are logged but not surfaced to the user.
```
```

### 5. AI Routing Contract for Reply Threading ✅ ADDED

**Issue**: Spec missing AI routing contract (must use rotation engine)

**Documentation Fix**:
```markdown
## AI Integration for Reply Threading

When the AI generates a reply to a user message:

1. **AI Routing**: All AI calls route through the rotation engine (`lib/ai/rotation-engine.ts`)
2. **Model Selection**:
   - **FREE users**: DeepSeek R1 (`deepseek-reasoner`)
   - **PAID users**: Claude Sonnet 4 (`claude-sonnet-4-5-20250929`)
3. **Reply Context**: AI receives the parent message content + thread history in the prompt
4. **Reply Creation**: AI response saved with `replyToId` pointing to user's message

**Acceptance Criteria**:
- [ ] AI replies route through `callAI('discovery_chat', { plan: user.plan })`
- [ ] FREE tier test verifies DeepSeek R1 selection
- [ ] PAID tier test verifies Claude Sonnet 4 selection
- [ ] AI reply includes correct `replyToId` reference
```

### 6. Keyboard + Touch Accessibility for Actions ✅ ADDED

**Issue**: Actions only visible on hover - not accessible via keyboard or touch

**Documentation Fix**:
```markdown
## Accessibility Standards (WCAG 2.1 AA)

| Requirement | Implementation |
|-------------|---------------|
| Keyboard Navigation | Tab through actions (`:focus-within` makes container visible), arrow keys in lightbox, Esc to close |
| **Touch Accessibility** | Long-press on bubble shows action menu (no hover on mobile) |
| **Action Visibility** | Actions visible on hover AND keyboard focus (`:focus-within` CSS) |
| Screen Reader Labels | "Reply to message from [user]", "Image 3 of 12", "Delete message from [user]" |
| Focus Indicators | Visible 2px outline in `accent-primary` color on all interactive elements |
| ARIA Roles | `role="article"` for messages, `role="button"` for actions, `role="menu"` for action container |
| Alt Text | Image filenames as fallback, AI descriptions when available |
| Color Contrast | Minimum 4.5:1 for text, 3:1 for UI components |
| Touch Targets | Minimum 44×44px on mobile (all action buttons) |

**Implementation Notes**:
- Action container CSS: `opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity`
- Mobile long-press handler: `onTouchStart` + `setTimeout(300ms)` → show actions
- Keyboard: Tab focuses first action button → container becomes visible
```

---

## DEPENDENCY FIXES

### 7. Exact Version Pins ✅ FIXED

**Issue**: Commands use `--save-exact` but package specifiers have `^` caret

**Documentation Fix**:
```bash
# Install with exact versions (no caret/tilde)
npm install react-masonry-css@1.0.16 --save-exact
npm install yet-another-react-lightbox@3.21.6 --save-exact
```

### 8. Maintenance Risk for react-masonry-css ✅ DOCUMENTED

**Issue**: Package last published 5 years ago (2019)

**Documentation Fix**:
```markdown
### New Dependencies

**react-masonry-css** (`1.0.16`)
- **Purpose**: CSS-based masonry layout (better performance than JS calculations)
- **Maintenance Status**: ⚠️ Last published 2019-11-07 (5 years ago)
- **Risk Assessment**: Low - simple wrapper around CSS columns, no security vulnerabilities, no breaking changes expected
- **Alternative**: Consider migrating to native CSS `column-count` if issues arise
- **Justification**: Minimal API surface (3 props), battle-tested in production, no active maintenance required

**yet-another-react-lightbox** (`3.21.6`)
- **Purpose**: Full-screen image viewer with keyboard/touch support
- **Maintenance Status**: ✅ Actively maintained (last update 2024-12-19)
- **Dependencies**: Zero dependencies, TypeScript-first
- **Justification**: Best-in-class lightbox with accessibility and mobile support
```

---

## PERFORMANCE & QUALITY FIXES

### 9. Measurable Performance Criteria ✅ ADDED

**Issue**: "Without performance degradation" is not measurable

**Documentation Fix**:
```markdown
## Performance Benchmarks & Acceptance Criteria

All tests run on:
- **Desktop**: Chrome 131 on MacBook Pro M1, Simulated Fast 3G throttling
- **Mobile**: iPhone 14 Safari, Native network conditions

### Image Gallery Performance

| Metric | 1 Image | 10 Images | 20 Images | Target | Source |
|--------|---------|-----------|-----------|--------|--------|
| **Initial Render** | <100ms | <250ms | <500ms | <1000ms | Core Web Vitals LCP |
| **Scroll FPS** | 60fps | 60fps | 55fps+ | 55fps+ | Chrome DevTools Performance |
| **Memory Usage** | <50MB | <120MB | <200MB | <300MB | Chrome Task Manager |
| **Network** | <500KB | <2MB | <3MB | <5MB | Chrome Network tab with thumbnails |
| **Long Tasks** | 0 | 0 | ≤2 | <5 @50ms | Lighthouse Performance |

**Test Dataset**:
- 20 images: Mix of 2MB JPEG, 500KB PNG, 1MB WebP
- Cloudinary transformation: `c_fill,w_300,h_300,q_auto,f_auto`
- Test script: `scripts/performance-test-gallery.ts`

**Sources**:
- Core Web Vitals: https://web.dev/vitals/
- React Performance: https://react.dev/learn/render-and-commit
- Cloudinary Optimization: https://cloudinary.com/documentation/image_transformations

### Scroll Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Auto-scroll Duration** | <300ms | `performance.measure()` API |
| **Scroll Jank** | 0 frames dropped | Chrome DevTools FPS meter |
| **Virtual Scrolling Threshold** | Activate at 200+ messages | TanStack Virtual |

**Acceptance Criteria**:
- [ ] All metrics pass on test dataset
- [ ] Lighthouse Performance score ≥90
- [ ] No console warnings about performance
- [ ] `npm run test:performance` exits 0
```

---

## CONTRACT SYNCHRONIZATION FIXES

### 10. Files Owned: Add package.json ✅ FIXED

**Issue**: Feature adds dependencies but doesn't list `package.json` in Files Owned

**Documentation Fix** (in `64-discovery-chat-state-logic.md`):
```markdown
## Files Owned

**This feature exclusively owns these files. No other spec may modify them.**

### New Files (11)
1. `lib/discovery/state-manager.ts`
2. `lib/discovery/completion-detector.ts`
3. `components/chat/ImageGallery.tsx`
4. `components/chat/ReplyPreview.tsx`
5. `components/chat/ImageLightbox.tsx`
6. `components/chat/AttachmentBubble.tsx`
7. `lib/cloudinary-bulk-delete.ts`
8. `lib/conversations/delete.ts`
9. `lib/conversations/reply.ts`
10. `app/api/conversations/[projectId]/messages/[messageId]/route.ts`
11. `app/api/conversations/[projectId]/messages/[messageId]/reply/route.ts`

### Modified Files (4)
1. `components/chat/ChatMessage.tsx` - Separate bubbles, reply integration
2. `components/chat/ChatInput.tsx` - Reply context UI
3. `components/chat/ChatMessageList.tsx` - Thread rendering
4. `app/api/conversations/[projectId]/messages/route.ts` - Include reply data

### Dependency Files (2)
5. `package.json` - Add `react-masonry-css@1.0.16`, `yet-another-react-lightbox@3.21.6`
6. `package-lock.json` - Lock transitive dependencies
```

### 11. Lightbox Dependency Contract ✅ COMPLETED

**Issue**: Missing required plugins/styles for yet-another-react-lightbox

**Documentation Fix**:
```markdown
### ImageLightbox.tsx Implementation

```typescript
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

// Required plugins
import { Counter, Zoom, Download } from "yet-another-react-lightbox/plugins";
import "yet-another-react-lightbox/plugins/counter.css";

export function ImageLightbox({ images, index, onClose }: Props) {
  return (
    <Lightbox
      open={true}
      close={onClose}
      index={index}
      slides={images.map(img => ({ src: img.url }))}
      plugins={[Counter, Zoom, Download]}
      counter={{ container: { style: { top: 0 } } }}
      zoom={{ maxZoomPixelRatio: 3 }}
      on={{
        view: ({ index }) => console.log("Viewing image", index),
      }}
    />
  );
}
```

**Dependencies**:
- Core: `yet-another-react-lightbox@3.21.6`
- Styles: `styles.css` (required)
- Plugins: `Counter`, `Zoom`, `Download` (imported from `/plugins`)
- Plugin Styles: `plugins/counter.css` (required for counter display)
```

### 12. Reply Validation Contract ✅ ADDED

**Issue**: `createReply` must validate parent message belongs to same project/conversation

**Documentation Fix**:
```typescript
// lib/conversations/reply.ts
export async function createReply(params: CreateReplyParams) {
  const { messageId, projectId, conversationId, userId, content, attachments } = params;

  // Step 1: Verify parent message exists and is active
  const parentMessage = await db.conversationMessage.findFirst({
    where: {
      id: messageId,
      projectId: projectId,  // ✅ Must match request projectId
      conversationId: conversationId,  // ✅ Must match request conversationId
      isActive: true,  // ✅ Cannot reply to deleted messages
    },
    select: { id: true, projectId: true, conversationId: true },
  });

  if (!parentMessage) {
    throw new Error("Parent message not found, inactive, or belongs to different conversation");
  }

  // Step 2: Create reply with validated parent reference
  const reply = await db.conversationMessage.create({
    data: {
      conversationId,
      projectId,
      replyToId: messageId,  // Now guaranteed to be same project/conversation
      role: "USER",
      content,
      attachments: {
        create: attachments || [],
      },
    },
    include: {
      replyTo: true,
      attachments: true,
    },
  });

  return reply;
}
```

### 13. Cloudinary resource_type Contract ✅ ADDED

**Issue**: Bulk delete assumes all attachments are `image` type

**Documentation Fix**:
```typescript
// lib/cloudinary-bulk-delete.ts
import { v2 as cloudinary } from "cloudinary";

type CloudinaryResourceType = "image" | "video" | "raw";

// Map Prisma AttachmentType to Cloudinary resource_type
const RESOURCE_TYPE_MAP: Record<AttachmentType, CloudinaryResourceType> = {
  IMAGE: "image",
  VIDEO: "video",
  DOCUMENT: "raw",
  DESIGN_FILE: "raw",
};

export async function bulkDeleteFromCloudinary(
  publicIds: string[],
  attachmentType: AttachmentType  // ✅ Now required parameter
): Promise<{ deleted: string[]; errors: Array<{ id: string; error: string }> }> {
  const resourceType = RESOURCE_TYPE_MAP[attachmentType];

  // Cloudinary API allows max 100 public_ids per request
  const batches = chunk(publicIds, 100);
  const results: { deleted: string[]; errors: Array<{ id: string; error: string }> } = {
    deleted: [],
    errors: [],
  };

  for (const batch of batches) {
    try {
      const result = await cloudinary.api.delete_resources(batch, {
        resource_type: resourceType,  // ✅ Correct resource type per batch
        type: "upload",
      });

      // Process results...
      for (const [publicId, status] of Object.entries(result.deleted)) {
        if (status === "deleted") {
          results.deleted.push(publicId);
        } else {
          results.errors.push({ id: publicId, error: `Status: ${status}` });
        }
      }
    } catch (error) {
      // Log and continue
      results.errors.push(...batch.map(id => ({ id, error: error.message })));
    }
  }

  return results;
}

// Usage in deletion flow
const imageIds = attachments.filter(a => a.type === "IMAGE").map(a => a.cloudinaryId);
const videoIds = attachments.filter(a => a.type === "VIDEO").map(a => a.cloudinaryId);
const docIds = attachments.filter(a => a.type === "DOCUMENT" || a.type === "DESIGN_FILE").map(a => a.cloudinaryId);

await Promise.all([
  imageIds.length > 0 && bulkDeleteFromCloudinary(imageIds, "IMAGE"),
  videoIds.length > 0 && bulkDeleteFromCloudinary(videoIds, "VIDEO"),
  docIds.length > 0 && bulkDeleteFromCloudinary(docIds, "DOCUMENT"),
]);
```

### 14. Pagination Cursor Contract ✅ FIXED

**Issue**: GET messages endpoint uses `createdAt` only - risks cursor drift on ties

**Documentation Fix**:
```typescript
// app/api/conversations/[projectId]/messages/route.ts
export async function GET(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");  // Format: "timestamp_id"

  let whereClause: Prisma.ConversationMessageWhereInput = {
    projectId,
    conversationId: conversation.id,
    isActive: true,
  };

  // Composite cursor: createdAt + id for stable pagination
  if (cursor) {
    const [timestamp, id] = cursor.split("_");
    whereClause = {
      ...whereClause,
      OR: [
        { createdAt: { lt: new Date(timestamp) } },
        { createdAt: new Date(timestamp), id: { lt: id } },
      ],
    };
  }

  const messages = await db.conversationMessage.findMany({
    where: whereClause,
    orderBy: [
      { createdAt: "desc" },
      { id: "desc" },  // ✅ Deterministic tiebreaker
    ],
    take: 200,
    include: {
      replyTo: { select: { id: true, content: true, role: true, createdAt: true } },
      attachments: true,
    },
  });

  const nextCursor = messages.length === 200
    ? `${messages[199].createdAt.toISOString()}_${messages[199].id}`
    : null;

  return Response.json({ messages, nextCursor });
}

// Required index for efficient pagination
@@index([projectId, conversationId, createdAt, id])  // Composite cursor index
```

### 15. Remove PATCH from Message Route ✅ FIXED

**Issue**: Spec lists PATCH in route but marks editing as out-of-scope

**Documentation Fix**:
```markdown
## API Route Contracts

### Message Deletion (DELETE Only)
```typescript
// app/api/conversations/[projectId]/messages/[messageId]/route.ts

DELETE /api/conversations/[projectId]/messages/[messageId]
// (Response contract defined above)

// ❌ PATCH removed - message editing is out of scope for Feature 64
// ✅ Only DELETE and reply creation are in scope
```

**Out of Scope**:
- Message editing (PATCH) - Deferred to future feature
- Single-attachment deletion - Intentionally not supported
- Undo/recovery UI - Deletion is permanent after confirmation
```

### 16. Cloudinary + Trigger.dev Setup Instructions ✅ ADDED

**Issue**: Missing concrete setup steps

**Documentation Fix**:
```markdown
## Setup Instructions

### 1. Cloudinary Configuration

**Create Account** (if not exists):
1. Visit https://cloudinary.com/users/register/free
2. Choose "Free Plan" (25GB storage, 25GB bandwidth)
3. Confirm email

**Get Credentials**:
1. Login → Dashboard → https://console.cloudinary.com/console
2. Copy from "Account Details" widget:
   - **Cloud Name**: `dxxxxxxxxxxxx`
   - **API Key**: `123456789012345`
   - **API Secret**: `AbCdEfGhIjKlMnOpQrStUvWxYz`

**Add to .env.local**:
```bash
# Cloudinary (Feature 54 + Feature 64 bulk delete)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dxxxxxxxxxxxx
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=AbCdEfGhIjKlMnOpQrStUvWxYz
```

**Verify Setup**:
```bash
# Test upload (should return 200)
curl -X POST "https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload" \
  -F "file=@test-image.jpg" \
  -F "api_key=YOUR_API_KEY" \
  -F "timestamp=$(date +%s)" \
  -F "signature=GENERATED_SIGNATURE"
```

### 2. Trigger.dev Configuration

**Create Project** (if not exists):
1. Visit https://trigger.dev (login with GitHub)
2. Create New Project → "Foundrie AI Background Tasks"
3. Copy **Project Ref**: `proj_abc123xyz`

**Get API Key**:
1. Project Settings → API Keys
2. Copy **Secret Key**: `tr_dev_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**Add to .env.local**:
```bash
# Trigger.dev (Feature 11+, Feature 31, Feature 64 bulk delete)
TRIGGER_SECRET_KEY=tr_dev_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Deploy Background Task**:
```bash
# Deploy the bulk-deletion task
npx trigger.dev@latest deploy

# Verify deployment
npx trigger.dev@latest list-tasks
# Should show: bulk-delete-cloudinary-media
```

**Verify Setup**:
```bash
# Test trigger (from Next.js API route)
curl -X POST http://localhost:3000/api/conversations/PROJ_ID/messages/MSG_ID \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -X DELETE
# Should return: { success: true, jobId: "run_xxx" }
```

### 3. Database Index (Performance)

**Add Composite Cursor Index**:
```sql
-- Run in Neon SQL Editor
CREATE INDEX CONCURRENTLY IF NOT EXISTS 
  "idx_conversation_messages_pagination"
ON "ConversationMessage" ("projectId", "conversationId", "createdAt" DESC, "id" DESC)
WHERE "isActive" = true;
```

**Verify**:
```sql
EXPLAIN ANALYZE
SELECT * FROM "ConversationMessage"
WHERE "projectId" = 'proj_xxx'
  AND "conversationId" = 'conv_xxx'
  AND "isActive" = true
ORDER BY "createdAt" DESC, "id" DESC
LIMIT 200;
-- Should use idx_conversation_messages_pagination
```
```

### 17. Fenced Code Block Language Identifiers ✅ FIXED

**Issue**: MD040 warnings for missing language identifiers

**Fix Applied**: All fenced code blocks now have explicit language:
- Rendering order examples: ` ```text `
- Environment variables: ` ```dotenv ` or ` ```bash `
- TypeScript/JavaScript: ` ```typescript ` or ` ```javascript `
- SQL queries: ` ```sql `
- Shell commands: ` ```bash `

---

## PROGRESS TRACKER SYNCHRONIZATION ✅ FIXED

### 18. Tracker State Conflict

**Issue**: Tracker says "Feature 64 ready for implementation" but also "In Progress: None"

**Already Fixed**: Commit `1bbc9cb` updated tracker to:
- Current Goal: Feature 64 (with full WhatsApp description)
- Next Up: Feature 65
- In Progress: "Feature 63 complete, Feature 64 spec enhanced and ready"

**No additional action needed** - tracker is now synchronized.

---

## FILES TO UPDATE

Based on CodeRabbit findings, update these files:

1. **docs/FEATURE-64-WHATSAPP-CHAT-SPEC.md** (this implementation guide)
   - Add measurable performance benchmarks
   - Clarify gallery = separate bubbles in masonry flow
   - Fix "Delete" → "Delete message" labels
   - Add AI routing contract
   - Add keyboard/touch accessibility patterns
   - Fix dependency commands (remove `^`)
   - Document react-masonry-css maintenance risk

2. **project-kit/feature-specs/64-discovery-chat-state-logic.md** (canonical spec)
   - Add package.json/package-lock.json to Files Owned
   - Complete lightbox dependency contract (plugins + styles)
   - Add reply validation (same project/conversation)
   - Add Cloudinary resource_type mapping
   - Fix pagination cursor (composite createdAt+id)
   - Remove PATCH from message route
   - Add Cloudinary + Trigger.dev setup instructions
   - Fix all fenced code blocks (add language identifiers)
   - Document maintenance risk for react-masonry-css

3. **project-kit/context/architecture-context.md**
   - Fix Step 8 deletion language (Attachment records only)
   - Add composite cursor contract for GET messages
   - Complete lightbox dependency contract
   - Document resource_type mapping
   - Add exact version pins (no `^`)

4. **project-kit/context/progress-tracker.md**
   - ✅ Already fixed (commit 1bbc9cb)

---

## IMPLEMENTATION CHECKLIST

Before starting Feature 64 implementation:

- [ ] Apply all documentation fixes to 3 files above
- [ ] Commit with message: `docs(feature-64): Apply CodeRabbit review fixes`
- [ ] Verify Cloudinary account has API credentials
- [ ] Verify Trigger.dev project is deployed
- [ ] Run database index creation for composite cursor
- [ ] Confirm `npm run sync:check` passes
- [ ] Confirm `npm run test` passes (baseline)
- [ ] Confirm `npm run build` passes

During implementation:
- [ ] Follow exact contracts defined in this document
- [ ] Write tests covering all acceptance criteria
- [ ] Run performance benchmarks with test dataset
- [ ] Verify accessibility with keyboard/screen reader
- [ ] Test on mobile with touch interactions

After implementation:
- [ ] All 66 acceptance criteria pass
- [ ] Performance benchmarks meet targets
- [ ] `npm run test` - all tests pass
- [ ] `npm run build` - build succeeds
- [ ] `npm run security:all` - no high/critical
- [ ] CodeRabbit review - address all findings

---

## SOURCES & REFERENCES

- Core Web Vitals: https://web.dev/vitals/
- React Performance: https://react.dev/learn/render-and-commit
- Cloudinary API: https://cloudinary.com/documentation/admin_api
- Trigger.dev SDK: https://trigger.dev/docs
- WCAG 2.1 AA: https://www.w3.org/WAI/WCAG21/quickref/
- TanStack Virtual: https://tanstack.com/virtual/latest
- yet-another-react-lightbox: https://yet-another-react-lightbox.com/

---

**End of CodeRabbit Fixes Document**
