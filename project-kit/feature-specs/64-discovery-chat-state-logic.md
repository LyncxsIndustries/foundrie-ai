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
  replyContent: string
  attachments?: AttachmentInput[]
}

export async function createReply(
  projectId: string,
  replyData: ReplyData
): Promise<ConversationMessage>

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
npm install react-masonry-css@^1.0.16 --save-exact
```

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
npm install yet-another-react-lightbox@^3.21.6 --save-exact
```

**Features:**
- Full-screen modal overlay
- Keyboard navigation (arrow keys, Esc)
- Zoom controls
- Download button
- Image counter (e.g., "3 of 12")
- Swipe gestures on mobile

### Bulk Cloudinary Deletion

```typescript
// lib/cloudinary-bulk-delete.ts
import { v2 as cloudinary } from 'cloudinary'

export async function bulkDeleteFromCloudinary(
  publicIds: string[]
): Promise<{ deleted: string[]; errors: string[] }> {
  // Batch delete up to 100 resources per request
  // Return deleted IDs and any errors
  // Use admin API with CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET
}
```

**Safety:**
- Queue deletion in background (Trigger.dev task for safety)
- Log all deletions for audit trail
- Continue on individual failures (don't fail entire batch)
- Return error list for retry logic

### Message Deletion with Cascade

```typescript
// lib/conversations/delete.ts
export async function deleteMessageCascade(
  messageId: string,
  projectId: string,
  userId: string
): Promise<{ success: boolean; deletedAttachments: number }>

// Process:
// 1. Verify ownership (message.project.userId === userId)
// 2. Fetch all attachments for message
// 3. Extract Cloudinary public IDs
// 4. Queue Cloudinary bulk delete (background)
// 5. Delete attachments from Attachment table
// 6. Set message.isActive = false (soft delete, preserves history)
// 7. Return success + count
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
  // Hover action menu (Copy URL, Delete, Reply)
}
```

**Rendering Order:**
```
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
- Message editing (defer to future messaging enhancement feature)
- Message reactions/emoji (defer to future enhancement)
- Voice/audio messages (defer to future enhancement)
- Message search/filtering (defer to future enhancement)

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
