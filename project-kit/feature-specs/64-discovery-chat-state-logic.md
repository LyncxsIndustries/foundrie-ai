# Feature 64 - Discovery Chat State & Logic

## Type

ENHANCEMENT

## What This Delivers

Comprehensive WhatsApp-style chat experience with state management, reply threading, advanced media handling, and conversation lifecycle. The system tracks completion status, counts messages accurately, implements dynamic stopping conditions, and provides professional messaging features:

1. **State Management**: Tracks DONE state, enables resume, exposes Generate Requirements button when complete
2. **Reply Threading**: WhatsApp-style reply-to with parent message preview for both text and media
3. **Staggered Media Gallery**: Pinterest/Instagram-style masonry grid for multiple images (supports 20+ attachments per message)
4. **Unified Actions**: Copy, Delete, Reply work on both text and image bubbles
5. **Delete Cascade**: Removing a message also deletes all attachments from DB + Cloudinary
6. **Separate Bubbles**: Text content and images render in separate bubbles (text first, then each image)

After this feature, Discovery Chat behaves as a professional messaging platform with structured conversation endpoints, visual threading, and intelligent media handling.

## Dependencies

- Feature 10 (Discovery Chat) - base chat implementation
- Feature 53 (Dynamic Phase Completion) - complexity classification logic
- Feature 63 (Discovery Chat UI Fixes) - UI refinements
- Feature 05 (AI Rotation Engine) - AI orchestration

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `research/FOUNDRIE_RESEARCH.md` (v15.0.0 dynamic phase completion)
- `context/code-standards.md`
- `context/ai-workflow-rules.md`

## Context7 Docs To Check

```bash
npx ctx7 library prisma "update model fields and relations"
npx ctx7 library next.js "server actions and optimistic updates"
```

## Files Owned

**This feature exclusively owns these files. No other spec may modify them.**

### New Files (11)
- `lib/discovery/state-manager.ts` (NEW)
- `lib/discovery/completion-detector.ts` (NEW)
- `components/chat/ImageGallery.tsx` (NEW)
- `components/chat/ReplyPreview.tsx` (NEW)
- `components/chat/ImageLightbox.tsx` (NEW)
- `components/chat/AttachmentBubble.tsx` (NEW)
- `lib/cloudinary-bulk-delete.ts` (NEW)
- `lib/conversations/delete.ts` (NEW)
- `lib/conversations/reply.ts` (NEW)
- `app/api/conversations/[projectId]/messages/[messageId]/route.ts` (NEW)
- `app/api/conversations/[projectId]/messages/[messageId]/reply/route.ts` (NEW)

### Dependency Files (2)
- `package.json` - Add `react-masonry-css@1.0.16`, `yet-another-react-lightbox@3.21.6`
- `package-lock.json` - Lock transitive dependencies

## Files

CREATE: `lib/discovery/state-manager.ts` - chat state tracking and persistence
CREATE: `lib/discovery/completion-detector.ts` - dynamic completion detection
CREATE: `components/chat/ImageGallery.tsx` - Pinterest-style masonry grid for 2+ images
CREATE: `components/chat/ReplyPreview.tsx` - parent message preview in reply threads
CREATE: `components/chat/ImageLightbox.tsx` - full-screen image viewer modal
CREATE: `components/chat/AttachmentBubble.tsx` - dedicated attachment rendering with actions
CREATE: `lib/cloudinary-bulk-delete.ts` - bulk Cloudinary resource deletion
CREATE: `lib/conversations/delete.ts` - message deletion with cascade cleanup
CREATE: `lib/conversations/reply.ts` - reply creation and threading helpers
CREATE: `app/api/conversations/[projectId]/messages/[messageId]/route.ts` - DELETE/PATCH message operations
CREATE: `app/api/conversations/[projectId]/messages/[messageId]/reply/route.ts` - POST reply creation
MODIFY: `components/chat/ChatMessage.tsx` - separate text/media bubbles, reply preview integration
MODIFY: `components/chat/ChatInput.tsx` - add reply context UI (show parent message being replied to)
MODIFY: `components/chat/ChatMessageList.tsx` - thread rendering and reply visualization
MODIFY: `app/api/conversations/[projectId]/messages/route.ts` - add reply data to fetched messages
MODIFY: `prisma/schema.prisma` - verify replyToId exists (already present from Feature 57)
UPDATE: `lib/discovery/state-manager.test.ts` - test state transitions
UPDATE: `lib/discovery/completion-detector.test.ts` - test completion logic
UPDATE: `components/chat/ImageGallery.test.tsx` - test masonry layout and lightbox
UPDATE: `components/chat/ReplyPreview.test.tsx` - test reply threading UI
UPDATE: `app/api/conversations/[projectId]/messages/[messageId]/route.test.ts` - DELETE cascade tests

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract, update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch.

### Database Schema Updates

```prisma
model Project {
  // ... existing fields
  
  // Discovery state tracking
  discoveryStatus    DiscoveryStatus @default(NOT_STARTED)
  messageCount       Int              @default(0)
  projectComplexity  ProjectComplexity @default(STANDARD)
  discoveryCompletedAt DateTime?
  
  // ... existing relations
}

enum DiscoveryStatus {
  NOT_STARTED
  IN_PROGRESS
  DONE
  DISCARDED
}

enum ProjectComplexity {
  SIMPLE    // 3-4 phases, 5-10 messages
  STANDARD  // 6-7 phases, 15-25 messages
  COMPLEX   // 8 phases, 30+ messages
}
```

**NOTE**: The `ConversationMessage.replyToId` field and `MessageReplies` relation already exist from Feature 57. No schema migration needed for reply threading.

### State Manager

```typescript
// lib/discovery/state-manager.ts
export class DiscoveryStateManager {
  async incrementMessageCount(projectId: string): Promise<number>
  async markComplete(projectId: string): Promise<void>
  async markDiscarded(projectId: string): Promise<void>
  async canResume(projectId: string): Promise<boolean>
  async getState(projectId: string): Promise<DiscoveryState>
}
```

### Completion Detector

```typescript
// lib/discovery/completion-detector.ts
export class CompletionDetector {
  detectComplexity(messages: Message[]): ProjectComplexity
  shouldComplete(messageCount: number, complexity: ProjectComplexity, latestMessage: string): boolean
  analyzeMessageDepth(messages: Message[]): number
}
```

### Dynamic Stopping Logic

- **SIMPLE projects**: Stop after 5-10 messages when core requirements are clear
- **STANDARD projects**: Stop after 15-25 messages when architecture is defined
- **COMPLEX projects**: Stop after 30+ messages when all subsystems are understood

Use semantic analysis of message content to detect when sufficient information is gathered.

### Reply Threading System

```typescript
// lib/conversations/reply.ts
export interface ReplyData {
  parentMessageId: string
  conversationId: string  // Required for validation
  projectId: string       // Required for validation
  replyContent: string
  attachments?: AttachmentInput[]
}

export async function createReply(
  userId: string,
  replyData: ReplyData
): Promise<ConversationMessage> {
  const { parentMessageId, projectId, conversationId, replyContent, attachments } = replyData;

  // Step 1: Verify parent message exists and is active
  const parentMessage = await db.conversationMessage.findFirst({
    where: {
      id: parentMessageId,
      projectId: projectId,        // ✅ Must match request projectId
      conversationId: conversationId,  // ✅ Must match request conversationId
      isActive: true,              // ✅ Cannot reply to deleted messages
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
      replyToId: parentMessageId,  // Now guaranteed to be same project/conversation
      role: "USER",
      content: replyContent,
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

export async function getMessageThread(messageId: string): Promise<ConversationMessage[]>
```

**Visual Design:**
- Show parent message preview above reply (max 3 lines with ellipsis)
- Connect parent → reply with subtle vertical line
- Gray background tint for parent preview to distinguish from main content
- Click parent preview to scroll to original message

### Image Gallery (Masonry Layout)

Use `react-masonry-css` for efficient staggered grid:

```bash
# Install with exact versions (no caret/tilde)
npm install react-masonry-css@1.0.16 --save-exact
```

**Package Status:**
- **Version**: 1.0.16
- **Last Published**: 2019-11-07 (5 years ago)
- **Risk Assessment**: ⚠️ Low - Simple CSS columns wrapper, no security vulnerabilities, battle-tested
- **Alternative**: Native CSS `column-count` if issues arise
- **Justification**: Minimal API (3 props), zero dependencies, proven in production

**Layout Algorithm:**
- 1 image: Full width (max 400px)
- 2 images: Side-by-side
- 3+ images: Staggered masonry grid (2-3 columns based on viewport)
- Variable heights for visual interest
- 8px gap between images
- Lazy loading for performance with 20+ images

```typescript
// components/chat/ImageGallery.tsx
interface ImageGalleryProps {
  images: Attachment[]
  onImageClick: (index: number) => void
  messageRole: 'user' | 'assistant'
}

export function ImageGallery({ images, onImageClick, messageRole }: ImageGalleryProps) {
  // Masonry grid implementation
  // Lightbox trigger on click
  // Copy/delete actions per image
}
```

### Image Lightbox

Use `yet-another-react-lightbox` for professional image viewing:

```bash
# Install with exact version
npm install yet-another-react-lightbox@3.21.6 --save-exact
```

**Package Status:**
- **Version**: 3.21.6
- **Last Updated**: 2024-12-19
- **Maintenance**: ✅ Actively maintained
- **Dependencies**: Zero dependencies, TypeScript-first

**Required Imports:**
```typescript
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";  // Required core styles

// Required plugins
import { Counter, Zoom, Download } from "yet-another-react-lightbox/plugins";
import "yet-another-react-lightbox/plugins/counter.css";  // Required for counter display
```

**Features:**
- Full-screen modal overlay
- Keyboard navigation (arrow keys, Esc)
- Zoom controls (via Zoom plugin)
- Download button (via Download plugin)
- Image counter (via Counter plugin - e.g., "3 of 12")
- Swipe gestures on mobile

### Bulk Cloudinary Deletion

```typescript
// lib/cloudinary-bulk-delete.ts
import { v2 as cloudinary } from 'cloudinary'
import { AttachmentType } from '@/lib/generated/prisma/client'

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
  attachmentType: AttachmentType  // Required: determines resource_type
): Promise<{ deleted: string[]; errors: Array<{ id: string; error: string }> }> {
  const resourceType = RESOURCE_TYPE_MAP[attachmentType];
  
  // Batch delete up to 100 resources per request
  // Return deleted IDs and any errors
  // Use admin API with CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET
  
  const batches = chunk(publicIds, 100);
  const results = { deleted: [], errors: [] };
  
  for (const batch of batches) {
    try {
      const result = await cloudinary.api.delete_resources(batch, {
        resource_type: resourceType,
        type: "upload",
      });
      
      for (const [publicId, status] of Object.entries(result.deleted)) {
        if (status === "deleted") {
          results.deleted.push(publicId);
        } else {
          results.errors.push({ id: publicId, error: `Status: ${status}` });
        }
      }
    } catch (error) {
      results.errors.push(...batch.map(id => ({ id, error: error.message })));
    }
  }
  
  return results;
}
```

**Usage in deletion flow:**
```typescript
// Group attachments by type for correct resource_type
const imageIds = attachments.filter(a => a.type === "IMAGE").map(a => a.cloudinaryId);
const videoIds = attachments.filter(a => a.type === "VIDEO").map(a => a.cloudinaryId);
const docIds = attachments.filter(a => a.type === "DOCUMENT" || a.type === "DESIGN_FILE").map(a => a.cloudinaryId);

await Promise.all([
  imageIds.length > 0 && bulkDeleteFromCloudinary(imageIds, "IMAGE"),
  videoIds.length > 0 && bulkDeleteFromCloudinary(videoIds, "VIDEO"),
  docIds.length > 0 && bulkDeleteFromCloudinary(docIds, "DOCUMENT"),
]);
```

**Safety:**
- Queue deletion in background (Trigger.dev task for safety)
- Log all deletions for audit trail
- Continue on individual failures (don't fail entire batch)
- Return error list for logging only (not surfaced to user)

### Message Deletion with Cascade

```typescript
// lib/conversations/delete.ts
export async function deleteMessageCascade(
  messageId: string,
  projectId: string,
  userId: string
): Promise<{ success: boolean; deletedCount: number; jobId: string }>

// 14-Step Process:
// 1. Verify ownership via requireProjectMember(projectId, userId)
// 2. Fetch all Attachment records for message
// 3. Extract cloudinaryId array from attachments
// 4. **Hard delete Attachment records from Neon** (immediate, permanent)
// 5. Queue Trigger.dev background task for Cloudinary media deletion
// 6. Set message.isActive = false (soft delete message only)
// 7. Return success + deletedCount + jobId (Trigger.dev run ID)
// 8. Frontend optimistically removes from UI
// 9. Background task groups attachments by type (IMAGE/VIDEO/DOCUMENT)
// 10. Background task calls bulkDeleteFromCloudinary per type
// 11. Background task logs all deletions for audit trail
// 12. Background task continues on individual failures (logged, not surfaced)
// 13. No undo/recovery - deletion is permanent after confirmation
// 14. Reply thread integrity preserved (FK constraints valid with isActive = false)
```

**Why soft delete the message but hard delete attachments:**
- **Message soft delete**: Preserves reply thread integrity (FK constraints remain valid), enables conversation history queries with `WHERE isActive = true`
- **Attachment hard delete**: Media storage is expensive; immediate cleanup prevents orphaned Cloudinary assets
- **No undo/recovery**: This is intentional - deletion is permanent after user confirmation
- **Audit trail**: Structured logs record all deletions for compliance

### API Route Contracts

```typescript
// app/api/conversations/[projectId]/messages/[messageId]/route.ts

DELETE /api/conversations/[projectId]/messages/[messageId]

Request:
  - Auth: requireProjectMember(projectId, userId)
  - Params: projectId, messageId

Response:
  {
    success: true,
    deletedCount: number,  // Number of Attachment records deleted from Neon
    jobId: string          // Trigger.dev task run ID for background Cloudinary cleanup
  }

Errors:
  - 401: Unauthenticated
  - 404: Message not found or unauthorized
  - 500: Database deletion failed

Note: Cloudinary media deletion happens asynchronously via Trigger.dev.
      The response confirms database deletion only.
      Background task failures are logged but not surfaced to the user.
```

```typescript
// app/api/conversations/[projectId]/messages/[messageId]/reply/route.ts

POST /api/conversations/[projectId]/messages/[messageId]/reply

Request:
  - Auth: requireProjectMember(projectId, userId)
  - Body: {
      content: string
      attachments?: AttachmentInput[]
    }
  - Validation:
    - Parent message must exist
    - Parent message must be in same projectId
    - Parent message must be in same conversationId  
    - Parent message must be active (isActive = true)

Response:
  {
    message: ConversationMessage & {
      replyTo: ConversationMessage | null
      attachments: Attachment[]
    }
  }

Errors:
  - 401: Unauthenticated
  - 404: Parent message not found, inactive, or belongs to different conversation
  - 400: Invalid content or attachments
```

### GET Messages with Composite Cursor

```typescript
// app/api/conversations/[projectId]/messages/route.ts (MODIFIED)

GET /api/conversations/[projectId]/messages

Request:
  - Auth: requireProjectMember(projectId, userId)
  - Query: cursor?: string (format: "timestamp_id")

Response:
  {
    messages: ConversationMessage[],  // Max 200 per page
    nextCursor: string | null
  }

Implementation:
  // Composite cursor: createdAt + id for stable pagination
  let whereClause = {
    projectId,
    conversationId,
    isActive: true,
  };
  
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

Required Database Index:
  @@index([projectId, conversationId, isActive, createdAt, id])
```

### AI Integration for Reply Threading

When the AI generates a reply to a user message:

**AI Routing Contract**:
1. All AI calls route through the rotation engine (`lib/ai/rotation-engine.ts`)
2. **Model Selection**:
   - **FREE users**: DeepSeek R1 (`deepseek-reasoner`)
   - **PAID users**: Claude Sonnet 4 (`claude-sonnet-4-5-20250929`)
3. **Reply Context**: AI receives parent message content + thread history in the prompt
4. **Reply Creation**: AI response saved with `replyToId` pointing to user's message

**Implementation**:
```typescript
// When AI replies
const aiReply = await callAI('discovery_chat', {
  plan: user.plan,  // Selects FREE→DeepSeek R1 or PAID→Claude Sonnet 4
  systemPrompt: getDiscoverySystemPrompt(),
  userPrompt: buildPromptWithThreadContext(parentMessage, threadHistory),
  maxTokens: 4000,
});

await createReply(user.id, {
  parentMessageId: userMessage.id,
  conversationId: conversation.id,
  projectId: project.id,
  replyContent: aiReply.text,
});
```

### Accessibility Standards (WCAG 2.1 AA)

| Requirement | Implementation |
|-------------|---------------|
| **Keyboard Navigation** | Tab through actions (`:focus-within` makes container visible), arrow keys in lightbox, Esc to close |
| **Touch Accessibility** | Long-press on bubble shows action menu (no hover dependency on mobile) |
| **Action Visibility** | Actions visible on hover AND keyboard focus via CSS: `opacity-0 group-hover:opacity-100 group-focus-within:opacity-100` |
| **Screen Reader Labels** | "Reply to message from [user]", "Image 3 of 12", "Delete message from [user]" |
| **Focus Indicators** | Visible 2px outline in `var(--accent-primary)` color on all interactive elements |
| **ARIA Roles** | `role="article"` for messages, `role="button"` for actions, `role="menu"` for action container |
| **Alt Text** | Image filenames as fallback, AI descriptions when available |
| **Color Contrast** | Minimum 4.5:1 for text, 3:1 for UI components (test with axe DevTools) |
| **Touch Targets** | Minimum 44×44px on mobile (all action buttons) |

**Mobile Long-Press Handler**:
```typescript
const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

const handleTouchStart = () => {
  const timer = setTimeout(() => {
    setActionsVisible(true);  // Show action menu after 300ms
  }, 300);
  setLongPressTimer(timer);
};

const handleTouchEnd = () => {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    setLongPressTimer(null);
  }
};
```

### Attachment Bubble Rendering

**New Component Structure:**
```typescript
// components/chat/AttachmentBubble.tsx
interface AttachmentBubbleProps {
  attachment: Attachment
  messageRole: 'user' | 'assistant'
  onCopy: () => void
  onDelete: () => void
  onReply: () => void
}

export function AttachmentBubble(props: AttachmentBubbleProps) {
  // Individual bubble for each attachment
  // Avatar + bubble styling matching text messages
  // Action container with :focus-within visibility
  // Long-press handler for mobile
}
```

**Rendering Order:**
```text
1. Text Bubble (if content exists)
2. Image Bubble 1
3. Image Bubble 2
4. ...
5. Document Bubble
6. Video Bubble
```

Each gets its own avatar, timestamp, and action menu.

## Out of Scope

- Requirements generation logic (Feature 11)
- Requirements page integration (Feature 65)
- Real-time collaborative editing (Feature 33 handles presence only)
- **Message editing (PATCH)** - Intentionally not supported; defer to future messaging enhancement feature
- **Single-attachment deletion** - Intentionally not supported; Delete action always removes entire message
- **Undo/recovery UI** - Deletion is permanent after confirmation
- Message reactions/emoji (defer to future enhancement)
- Voice/audio messages (defer to future enhancement)
- Message search/filtering (defer to future enhancement)

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
```dotenv
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
```dotenv
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
# Should return: { success: true, jobId: "run_xxx", deletedCount: N }
```

### 3. Database Index (Performance)

**Add Composite Cursor Index**:
```sql
-- Run in Neon SQL Editor
CREATE INDEX CONCURRENTLY IF NOT EXISTS 
  "idx_conversation_messages_pagination"
ON "ConversationMessage" ("projectId", "conversationId", "isActive", "createdAt" DESC, "id" DESC)
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

### 4. Install Dependencies

```bash
# Install exact versions
npm install react-masonry-css@1.0.16 --save-exact
npm install yet-another-react-lightbox@3.21.6 --save-exact
```

## Future Modifications

- Feature 65 (Requirements Page Integration) - uses discoveryStatus to show/hide buttons
- Feature 71 (AI Rotation Models) - may enhance complexity detection with better models
- Future messaging enhancement - add editing, reactions, search

## Quality Gates

- Run `npm run sync:check` and ensure it passes
- Run `npm run security:all` and ensure it passes  
- Run `npm run test` and ensure it passes
- Run `npm run build` and ensure it passes

## Acceptance Criteria

### State Management
- [ ] Prisma schema includes discoveryStatus, messageCount, projectComplexity fields
- [ ] Message count increments on each discovery message
- [ ] Project complexity is auto-detected based on message content
- [ ] Dynamic stopping condition prevents endless questioning
- [ ] SIMPLE projects complete after 5-10 messages
- [ ] STANDARD projects complete after 15-25 messages
- [ ] COMPLEX projects complete after 30+ messages
- [ ] discoveryStatus transitions: NOT_STARTED → IN_PROGRESS → DONE
- [ ] "Discard chat" marks status as DISCARDED
- [ ] Chat can be resumed if status is IN_PROGRESS
- [ ] discoveryCompletedAt timestamp is set when marked DONE
- [ ] "Generate Requirements" button appears only when status is DONE
- [ ] State persistence survives page refresh

### Reply Threading
- [ ] User can reply to any text message
- [ ] User can reply to any image/attachment message
- [ ] AI can reply to user messages (threading support)
- [ ] Parent message preview shows above reply (max 3 lines)
- [ ] Click parent preview scrolls to original message
- [ ] Visual connection (line) from parent to reply
- [ ] replyToId stored correctly in ConversationMessage table
- [ ] Reply threads display correctly after page refresh
- [ ] Multiple levels of replies supported (reply to a reply)

### AI Integration
- [ ] All AI replies route through rotation engine (`callAI('discovery_chat')`)
- [ ] FREE tier users get DeepSeek R1 model
- [ ] PAID tier users get Claude Sonnet 4 model
- [ ] AI receives parent message + thread history in context
- [ ] AI replies save with correct `replyToId` reference
- [ ] Model selection test verifies FREE→DeepSeek R1 path
- [ ] Model selection test verifies PAID→Claude Sonnet 4 path

### Image Gallery & Media Handling
- [ ] Text and images render in separate bubbles
- [ ] Single image displays full-width (max 400px)
- [ ] 2 images display side-by-side
- [ ] 3+ images display in masonry grid (staggered layout)
- [ ] Gallery handles 20+ images without performance degradation
- [ ] Lazy loading enabled for large galleries
- [ ] Click image opens lightbox modal
- [ ] Lightbox supports keyboard navigation (arrows, Esc)
- [ ] Lightbox shows image counter ("3 of 12")
- [ ] Lightbox includes zoom and download controls
- [ ] Each attachment bubble has its own avatar
- [ ] Each attachment bubble has its own timestamp

### Unified Actions
- [ ] Copy action works on text messages
- [ ] Copy action works on image attachments (copies URL)
- [ ] Delete action works on text messages
- [ ] Delete action works on image/document/video attachments
- [ ] Reply action works on text messages
- [ ] Reply action works on all attachment types
- [ ] Action buttons appear on hover for both text and media
- [ ] Action buttons have consistent visual styling

### Accessibility (WCAG 2.1 AA)
- [ ] Actions visible on keyboard focus (`:focus-within` CSS)
- [ ] Long-press on mobile shows action menu (300ms timeout)
- [ ] Tab navigation cycles through all action buttons
- [ ] Screen reader labels include context ("Delete message from Alice")
- [ ] Focus indicators have 2px outline in accent color
- [ ] ARIA roles applied (`role="article"`, `role="button"`, `role="menu"`)
- [ ] Alt text provided for all images
- [ ] Color contrast meets 4.5:1 for text, 3:1 for UI
- [ ] All touch targets minimum 44×44px
- [ ] Keyboard test passes (all features accessible without mouse)
- [ ] Screen reader test passes (VoiceOver/NVDA/JAWS)

### Delete Cascade
- [ ] Deleting a message with attachments triggers cascade
- [ ] All attachments deleted from Attachment table
- [ ] All attachments deleted from Cloudinary (background job)
- [ ] Message marked isActive = false (soft delete)
- [ ] Deletion logged for audit trail
- [ ] Individual Cloudinary failures don't fail entire deletion
- [ ] Error list returned for failed Cloudinary deletions
- [ ] Replies to deleted messages show "Message deleted" placeholder

### Testing & Quality
- [ ] All state transitions are tested
- [ ] Reply threading is tested (create, display, fetch)
- [ ] Image gallery is tested (1, 2, 3+ images)
- [ ] Lightbox is tested (open, navigate, close)
- [ ] Delete cascade is tested (DB + Cloudinary cleanup)
- [ ] Bulk operations tested (20+ images in gallery)
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at Feature 65
- [ ] All quality gates pass
- [ ] CodeRabbit review completed and all findings resolved (recommended quality gate)

## Setup Instructions

### Required NPM Packages

```bash
npm install react-masonry-css@^1.0.16 --save-exact
npm install yet-another-react-lightbox@^3.21.6 --save-exact
```

### Database Migration

After implementing schema changes:
```bash
npm run db:generate
npm run db:migrate
```

### Cloudinary Configuration

Ensure the following environment variables are set (already configured in Feature 54):
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

The bulk delete function uses the admin API, which requires both API key and secret.

### Trigger.dev Configuration

Bulk Cloudinary deletion runs as a background task for safety. Ensure Trigger.dev is configured:
```
TRIGGER_SECRET_KEY=your_trigger_secret
```

For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.

### Package Documentation

**react-masonry-css**: 
- GitHub: https://github.com/paulcollett/react-masonry-css
- Simple, performant masonry layout with no jQuery dependency
- Responsive breakpoints configured via props

**yet-another-react-lightbox**:
- GitHub: https://github.com/igordanchenko/yet-another-react-lightbox
- Modern, accessible lightbox component
- Zero dependencies, tree-shakeable
- Built-in keyboard navigation and touch gestures

Both packages are chosen for their minimal dependencies, TypeScript support, and active maintenance.
