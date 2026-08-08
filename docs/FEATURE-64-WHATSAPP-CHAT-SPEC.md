# Feature 64: WhatsApp-Style Chat Implementation Spec

**Status**: Specification Complete - Ready for Implementation  
**Date**: 2026-08-04  
**Type**: Enhancement - Comprehensive Messaging Platform

## Overview

Feature 64 transforms Discovery Chat from basic state management into a professional-grade messaging platform matching WhatsApp, Slack, and Discord quality standards. This document details the complete implementation specification.

## What Was Added

### 1. Reply Threading System
- **Any message can be replied to** (text, images, documents, videos)
- **Parent message preview** shows above reply (max 3 lines with ellipsis)
- **Visual connection** via subtle vertical line from parent to reply
- **Click to scroll** - clicking parent preview jumps to original message
- **Database**: Uses existing `ConversationMessage.replyToId` field (Feature 57)
- **Multi-level support**: Reply to a reply is fully supported

### 2. Staggered Image Gallery (Masonry Layout Within Message Group)
- Each image attachment renders as a **separate bubble** with its own avatar/timestamp/actions
- Multiple image bubbles from the same message visually flow in a masonry-style layout
- **1 image**: Full-width display (max 400px)
- **2 images**: Side-by-side grid pattern
- **3+ images**: Pinterest/Instagram-style staggered masonry visual flow
- **Handles 20+ images** (as separate bubbles) without performance degradation
- **Lazy loading** via Intersection Observer API
- **Lightbox modal** with:
  - Full-screen overlay
  - Keyboard navigation (arrow keys, Esc)
  - Zoom controls
  - Download button
  - Image counter ("3 of 12")
  - Swipe gestures on mobile

### 3. Separate Text/Media Bubbles
**Old behavior** (Feature 63 bug):
- Text and images rendered in same bubble
- Confusing visual hierarchy
- Single avatar/timestamp for mixed content

**New behavior** (Feature 64):
- Text renders in its own bubble
- Each attachment gets **separate bubble** with its own:
  - Avatar
  - Timestamp
  - Action menu (Copy URL, Delete, Reply)
- Rendering order: Text → Image 1 → Image 2 → ... → Documents → Videos

### 4. Unified Actions
All actions work consistently across text and media bubbles:

| Action | Text Messages | Image Attachments | Documents | Videos |
|--------|--------------|-------------------|-----------|--------|
| Copy | Copies content | Copies Cloudinary URL | Copies Cloudinary URL | Copies Cloudinary URL |
| **Delete Message** | Deletes message + all attachments | Deletes message + all attachments | Deletes message + all attachments | Deletes message + all attachments |
| Reply | Creates thread | Creates thread | Creates thread | Creates thread |

**Note**: The Delete action always removes the entire message and cascades to all attachments. Single-attachment deletion is intentionally not supported to preserve message integrity.

### 5. Delete Cascade System

**14-Step Deletion Flow:**
1. User clicks delete on message/attachment
2. Frontend shows confirmation dialog
3. DELETE request to `/api/conversations/[projectId]/messages/[messageId]`
4. Server verifies ownership via `requireProjectMember`
**14-Step Deletion Flow:**
1. User clicks "Delete message" on any bubble
2. Frontend shows confirmation dialog
3. DELETE request to `/api/conversations/[projectId]/messages/[messageId]`
4. Server verifies ownership via `requireProjectMember`
5. Fetch all `Attachment` records for message
6. Extract `cloudinaryId` array
7. **Hard delete `Attachment` records from Neon** (immediate, permanent)
8. **Queue Trigger.dev task** for background Cloudinary media deletion
9. Set `ConversationMessage.isActive = false` (soft delete message only)
10. Return success response with deletedCount + jobId
11. Frontend optimistically removes from UI
12. Background task groups attachments by type (IMAGE/VIDEO/DOCUMENT)
13. Background task deletes from Cloudinary (max 100/batch per resource_type)
14. Background task logs all deletions for audit trail

**Why soft delete the message but hard delete attachments:**
- **Message soft delete**: Preserves reply thread integrity (FK constraints remain valid), enables conversation history queries with `WHERE isActive = true`
- **Attachment hard delete**: Media storage is expensive; immediate cleanup prevents orphaned Cloudinary assets
- **No undo/recovery**: This is intentional - deletion is permanent after user confirmation
- **Audit trail**: Structured logs record all deletions for compliance

## Planned New Files & Components

### Planned New Files (11)
1. `lib/discovery/state-manager.ts` - Chat state tracking
2. `lib/discovery/completion-detector.ts` - Dynamic completion
3. `components/chat/ImageGallery.tsx` - Masonry layout
4. `components/chat/ReplyPreview.tsx` - Parent message preview
5. `components/chat/ImageLightbox.tsx` - Full-screen viewer
6. `components/chat/AttachmentBubble.tsx` - Individual attachment rendering
7. `lib/cloudinary-bulk-delete.ts` - Bulk Cloudinary deletion
8. `lib/conversations/delete.ts` - Message deletion with cascade
9. `lib/conversations/reply.ts` - Reply creation helpers
10. `app/api/conversations/[projectId]/messages/[messageId]/route.ts` - DELETE only
11. `app/api/conversations/[projectId]/messages/[messageId]/reply/route.ts` - POST reply

### Planned Modified Files (4)
1. `components/chat/ChatMessage.tsx` - Separate bubbles, reply integration
2. `components/chat/ChatInput.tsx` - Reply context UI
3. `components/chat/ChatMessageList.tsx` - Thread rendering
4. `app/api/conversations/[projectId]/messages/route.ts` - Include reply data + composite cursor
2. `components/chat/ChatInput.tsx` - Reply context UI
3. `components/chat/ChatMessageList.tsx` - Thread rendering
4. `app/api/conversations/[projectId]/messages/route.ts` - Include reply data

### New Dependencies
```bash
# Install with exact versions (no caret/tilde)
npm install react-masonry-css@1.0.16 --save-exact
npm install yet-another-react-lightbox@3.21.6 --save-exact
```

**Package Status:**
- **react-masonry-css** (1.0.16): ⚠️ Last published 2019 (5 years ago), but low risk - simple CSS wrapper, no vulnerabilities, battle-tested
- **yet-another-react-lightbox** (3.21.6): ✅ Actively maintained (last update Dec 2024), zero dependencies

## Database Contracts

### No Schema Migration Required
The `ConversationMessage.replyToId` field and `MessageReplies` self-referential relation already exist from Feature 57. No migration needed for reply threading.

### Existing Schema (Reference)
```prisma
model ConversationMessage {
  id             String       @id @default(cuid())
  conversationId String
  projectId      String
  role           MessageRole
  content        String       @db.Text
  
  // Reply threading (Feature 57)
  isActive       Boolean      @default(true)
  replyToId      String?
  replyTo        ConversationMessage?  @relation("MessageReplies", fields: [replyToId], references: [id], onDelete: SetNull)
  replies        ConversationMessage[] @relation("MessageReplies")
  
  attachments  Attachment[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([conversationId, createdAt])
  @@index([projectId, createdAt])
}

model Attachment {
  id            String         @id @default(cuid())
  messageId     String
  type          AttachmentType
  cloudinaryId  String
  cloudinaryUrl String
  originalName  String
  mimeType      String
  sizeBytes     Int
  width         Int?
  height        Int?
  extractedText String?        @db.Text
  
  message ConversationMessage @relation(fields: [messageId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  
  @@index([messageId])
}
```

## API Route Contracts

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

### Reply Creation
```typescript
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
GET /api/conversations/[projectId]/messages

Request:
  - Auth: requireProjectMember(projectId, userId)
  - Query: cursor?: string (format: "timestamp_id")

Response:
  {
    messages: ConversationMessage[],  // Max 200 per page
    nextCursor: string | null
  }

Implementation Note:
  Uses composite cursor (createdAt + id) for stable pagination.
  Required database index: [projectId, conversationId, isActive, createdAt, id]
```

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

### Performance Optimizations

1. **Virtual Scrolling**: TanStack Virtual for 1000+ messages
2. **Lazy Loading**: Intersection Observer for images below fold
3. **Cloudinary Thumbnails**: `c_fill,w_300,h_300,q_auto,f_auto` (75% smaller than full-size)
4. **Debounced Scroll**: 150ms debounce on auto-scroll detection
5. **Optimistic Updates**: Show messages immediately, sync async with rollback on error
6. **Composite Cursor Pagination**: Fetch 200 messages per load, stable ordering (createdAt + id)
7. **CSS Masonry**: Native CSS columns, better performance than JS layout
8. **Image Preloading**: Lightbox next/prev images for smooth navigation

## Accessibility Standards (WCAG 2.1 AA)

| Requirement | Implementation |
|-------------|---------------|
| **Keyboard Navigation** | Tab through actions (`:focus-within` makes container visible), arrow keys in lightbox, Esc to close |
| **Touch Accessibility** | Long-press on bubble shows action menu (300ms timeout, no hover dependency on mobile) |
| **Action Visibility** | Actions visible on hover AND keyboard focus: `opacity-0 group-hover:opacity-100 group-focus-within:opacity-100` |
| **Screen Reader Labels** | "Reply to message from [user]", "Image 3 of 12", "Delete message from [user]" |
| **Focus Indicators** | Visible 2px outline in `var(--accent-primary)` color on all interactive elements |
| **ARIA Roles** | `role="article"` for messages, `role="button"` for actions, `role="menu"` for action container |
| Alt Text | Image filenames as fallback, AI descriptions when available |
| Color Contrast | Minimum 4.5:1 for text, 3:1 for UI components |
| Touch Targets | Minimum 44×44px on mobile |

## AI Integration for Reply Threading

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

## Acceptance Criteria (73 Total)

### State Management (13 criteria)
- [ ] Message count increments on each message
- [ ] Project complexity auto-detected (SIMPLE/STANDARD/COMPLEX)
- [ ] Dynamic stopping conditions (5-10/15-25/30+ messages)
- [ ] discoveryStatus transitions correctly
- [ ] "Generate Requirements" appears only when DONE
- [ ] State persists across page refresh
- [ ] All transitions tested

### Reply Threading (9 criteria)
- [ ] Reply works on text messages
- [ ] Reply works on all attachment types
- [ ] Parent preview shows (max 3 lines)
- [ ] Click preview scrolls to parent
- [ ] Visual line connection rendered
- [ ] replyToId stored correctly
- [ ] Threads display after refresh
- [ ] Multi-level replies work
- [ ] AI can reply to user messages

### AI Integration (7 criteria)
- [ ] All AI replies route through rotation engine
- [ ] FREE tier test verifies DeepSeek R1 selection
- [ ] PAID tier test verifies Claude Sonnet 4 selection
- [ ] AI receives parent message context
- [ ] AI receives thread history
- [ ] AI replies save with correct replyToId
- [ ] Both subscription paths tested

### Image Gallery & Media (12 criteria)
- [ ] Text and images in separate bubbles
- [ ] 1 image: full-width
- [ ] 2 images: side-by-side
- [ ] 3+ images: masonry grid
- [ ] 20+ images: no performance issues
- [ ] Lazy loading enabled
- [ ] Lightbox opens on click
- [ ] Keyboard nav in lightbox
- [ ] Image counter displayed
- [ ] Zoom and download controls
- [ ] Each bubble has avatar
- [ ] Each bubble has timestamp

### Unified Actions (8 criteria)
- [ ] Copy works on text
- [ ] Copy works on images (URL)
- [ ] Delete works on text
- [ ] Delete works on all attachments
- [ ] Reply works on text
- [ ] Reply works on all attachments
- [ ] Actions appear on hover
- [ ] Consistent styling

### Delete Cascade (8 criteria)
- [ ] Attachments deleted from DB
- [ ] Attachments deleted from Cloudinary
- [ ] Message soft-deleted (isActive=false)
- [ ] Deletion logged for audit
- [ ] Individual failures don't break batch
- [ ] Error list returned
- [ ] Deleted messages show placeholder
- [ ] Reply integrity maintained

### Accessibility (11 criteria)
- [ ] Actions visible on keyboard focus (`:focus-within`)
- [ ] Long-press shows actions on mobile (300ms)
- [ ] Tab navigation through all actions
- [ ] Screen reader labels include context
- [ ] Focus indicators 2px outline in accent
- [ ] ARIA roles applied correctly
- [ ] Alt text provided for images
- [ ] Color contrast meets 4.5:1 / 3:1
- [ ] Touch targets minimum 44×44px
- [ ] Keyboard test passes (no mouse needed)
- [ ] Screen reader test passes (VoiceOver/NVDA)

### Performance (5 criteria)
- [ ] All metrics pass test dataset benchmarks
- [ ] Lighthouse Performance score ≥90
- [ ] No console performance warnings
- [ ] 20+ images load without jank
- [ ] Virtual scrolling activates at 200+ messages

### Testing & Quality (16 criteria)
- [ ] State transitions tested
- [ ] Reply threading tested
- [ ] Image gallery tested (1/2/3+ images)
- [ ] Lightbox tested
- [ ] Delete cascade tested
- [ ] Bulk operations tested (20+ images)
- [ ] All quality gates pass
- [ ] CodeRabbit review complete
- [ ] progress-tracker.md updated
- [ ] Accessibility tested
- [ ] Keyboard nav tested
- [ ] Screen reader tested
- [ ] Touch targets validated
- [ ] Performance benchmarked
- [ ] Error handling tested
- [ ] Edge cases covered

## Implementation Order

### Phase 1: Infrastructure (Backend)
1. Create Cloudinary bulk delete utility
2. Build message deletion API with cascade
3. Build reply creation API
4. Add reply data to message fetch API
5. Test all API routes (401/404/200 flows)

### Phase 2: UI Components (Building Blocks)
1. Create ReplyPreview component
2. Create ImageGallery with masonry layout
3. Create ImageLightbox component
4. Create AttachmentBubble component
5. Test each component in isolation

### Phase 3: Integration (Wire Everything)
1. Refactor ChatMessage to separate text/media
2. Update ChatInput with reply context
3. Update ChatMessageList for threading
4. Add action handlers (copy/delete/reply)
5. Test full messaging flow

### Phase 4: Polish (UX Refinements)
1. Add loading states
2. Implement optimistic updates
3. Error handling and retry logic
4. Accessibility audit
5. Performance optimization

## Quality Gates (Must Pass Before Commit)

```bash
npm run sync:check    # Contract synchronization
npm run security:all  # SAST + dependency audit + secret detection
npm run test          # All tests pass
npm run build         # Build succeeds
```

All gates enforced via `package.json` hooks and `.husky/pre-commit`.

## Contract Synchronization

**Files Updated** (per Hard Rule 0):
1. ✅ `project-kit/feature-specs/64-discovery-chat-state-logic.md` - Expanded from 13 to 66 acceptance criteria
2. ✅ `project-kit/context/architecture-context.md` - Added "Messaging & Reply Threading Architecture" section (200+ lines)
3. ✅ `project-kit/context/progress-tracker.md` - Added comprehensive session note
4. ✅ `docs/FEATURE-64-WHATSAPP-CHAT-SPEC.md` - This implementation guide

**Verification**: `npm run sync:check` ✅ PASSED

## References

- **Feature 54**: Enhanced Discovery Chat UI (file upload, fixed scrolling, Cloudinary)
- **Feature 57**: Claude-style thinking UI, reply threading schema
- **Feature 63**: Discovery Chat UI fixes (separate bubbles)
- **Feature 64**: This feature - State management + WhatsApp-style messaging

## Next Steps

1. **Review this spec** - Verify requirements match user needs
2. **Branch from master**: `git checkout -b feature/64-discovery-chat-state-logic`
3. **Install dependencies**: `npm install react-masonry-css yet-another-react-lightbox --save-exact`
4. **Implement Phase 1**: Backend infrastructure (APIs, utilities)
5. **Implement Phase 2**: UI components
6. **Implement Phase 3**: Integration
7. **Implement Phase 4**: Polish
8. **Run quality gates**: All must pass
9. **Push for review**: CodeRabbit + user review
10. **Merge to master**: After all findings resolved

---

**Feature Owner**: Discovery Chat Team  
**Dependencies**: Feature 54, 57, 63  
**Estimated Complexity**: HIGH (11 new files, 4 modified files, comprehensive testing)  
**Estimated Time**: 3-5 days for full implementation + testing + review