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

### 2. Staggered Image Gallery (Masonry Layout)
- **1 image**: Full-width display (max 400px)
- **2 images**: Side-by-side grid
- **3+ images**: Pinterest/Instagram-style staggered masonry layout
- **Handles 20+ images** without performance degradation
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
All actions work consistently across text and media:

| Action | Text Messages | Image Attachments | Documents | Videos |
|--------|--------------|-------------------|-----------|--------|
| Copy | Copies content | Copies URL | Copies URL | Copies URL |
| Delete | Cascade cleanup | Cascade cleanup | Cascade cleanup | Cascade cleanup |
| Reply | Creates thread | Creates thread | Creates thread | Creates thread |
| Edit | ✅ Supported | ❌ Preserve integrity | ❌ Preserve integrity | ❌ Preserve integrity |

### 5. Delete Cascade System

**14-Step Deletion Flow:**
1. User clicks delete on message/attachment
2. Frontend shows confirmation dialog
3. DELETE request to `/api/conversations/[projectId]/messages/[messageId]`
4. Server verifies ownership via `requireProjectMember`
5. Fetch all `Attachment` records for message
6. Extract `cloudinaryId` array
7. **Queue Trigger.dev task** for background Cloudinary deletion
8. Delete `Attachment` records from Neon
9. Set `ConversationMessage.isActive = false` (soft delete)
10. Return success response with deletion count
11. Frontend optimistically removes from UI
12. Background task deletes from Cloudinary (max 100/request)
13. Log all deletions for audit trail
14. Continue on individual failures (return error list)

**Why soft delete:**
- Preserves conversation history
- Maintains reply thread integrity
- Enables undo/recovery
- Audit compliance
- Database FK constraints remain valid

## New Files & Components

### New Files Created
1. `lib/discovery/state-manager.ts` - Chat state tracking
2. `lib/discovery/completion-detector.ts` - Dynamic completion
3. `components/chat/ImageGallery.tsx` - Masonry layout
4. `components/chat/ReplyPreview.tsx` - Parent message preview
5. `components/chat/ImageLightbox.tsx` - Full-screen viewer
6. `components/chat/AttachmentBubble.tsx` - Individual attachment rendering
7. `lib/cloudinary-bulk-delete.ts` - Bulk Cloudinary deletion
8. `lib/conversations/delete.ts` - Message deletion with cascade
9. `lib/conversations/reply.ts` - Reply creation helpers
10. `app/api/conversations/[projectId]/messages/[messageId]/route.ts` - DELETE/PATCH
11. `app/api/conversations/[projectId]/messages/[messageId]/reply/route.ts` - POST reply

### Modified Files
1. `components/chat/ChatMessage.tsx` - Separate bubbles, reply integration
2. `components/chat/ChatInput.tsx` - Reply context UI
3. `components/chat/ChatMessageList.tsx` - Thread rendering
4. `app/api/conversations/[projectId]/messages/route.ts` - Include reply data

### New Dependencies
```bash
npm install react-masonry-css@^1.0.16 --save-exact
npm install yet-another-react-lightbox@^3.21.6 --save-exact
```

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
    deletedAttachments: number,
    errors: string[]  // Individual Cloudinary failures
  }

Errors:
  - 401: Unauthenticated
  - 404: Message not found or unauthorized
  - 500: Deletion failed
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

Response:
  {
    message: ConversationMessage & {
      replyTo: ConversationMessage | null
      attachments: Attachment[]
    }
  }

Errors:
  - 401: Unauthenticated
  - 404: Parent message not found or inactive
  - 400: Invalid content or attachments
```

### Message Update
```typescript
PATCH /api/conversations/[projectId]/messages/[messageId]

Request:
  - Auth: requireProjectMember(projectId, userId)
  - Body: { content: string }

Response:
  {
    message: ConversationMessage
  }

Note: Cannot edit attachments (preserve media integrity)

Errors:
  - 401: Unauthenticated
  - 404: Message not found or unauthorized
  - 400: Invalid content
```

## Performance Optimizations

1. **Virtual Scrolling**: TanStack Virtual for 1000+ messages
2. **Lazy Loading**: Intersection Observer for images
3. **Cloudinary Thumbnails**: `/image/upload/c_fill,w_300,h_300/` instead of full-size
4. **Debounced Scroll**: Prevent thrashing on auto-scroll detection
5. **Optimistic Updates**: Show messages immediately, sync async
6. **Cursor Pagination**: Fetch 200 messages per load, no offset drift
7. **CSS Masonry**: Better performance than JS layout calculations
8. **Image Preloading**: Lightbox next/prev images for smooth navigation

## Accessibility Standards (WCAG 2.1 AA)

| Requirement | Implementation |
|-------------|---------------|
| Keyboard Navigation | Tab through actions, arrow keys in lightbox, Esc to close |
| Screen Reader Labels | "Reply to message from [user]", "Image 3 of 12", "Delete message" |
| Focus Indicators | Visible 2px outline in accent color on all interactive elements |
| ARIA Roles | `role="article"` for messages, `role="button"` for actions |
| Alt Text | Image filenames as fallback, AI descriptions when available |
| Color Contrast | Minimum 4.5:1 for text, 3:1 for UI components |
| Touch Targets | Minimum 44×44px on mobile |

## Acceptance Criteria (66 Total)

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