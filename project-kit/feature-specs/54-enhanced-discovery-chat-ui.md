# Feature 54 - Enhanced Discovery Chat UI with File Upload

## Type

ENHANCEMENT

## What This Delivers

A premium chat interface for the discovery phase that supports rich media uploads (images, screenshots, videos, documents), auto-scrolls to new messages, fixes scrolling so only the chat area scrolls (sidebar and header remain fixed), implements proper session memory and context management, and uses Cloudinary for media storage. The chat feel is clean, professional, and comparable to Claude, ChatGPT, or premium AI interfaces.

## Dependencies

- Feature 10 (Discovery Chat) provides the base conversation infrastructure
- Feature 53 (Dynamic Phase Completion) integrates with the enhanced UI
- Cloudinary account required for media storage

## Context To Read First

- `context/project-overview.md` — Discovery protocol and user flows
- `context/ui-context.md` — Current UI standards
- `context/architecture-context.md` — Vercel Blob and storage patterns
- `ARTKINS_STYLE_GUIDE.md` — Premium UI standards
- `research/FOUNDRIE_V15.0.0.md` — UI/UX improvements for this version

## Context7 Docs To Check

- Cloudinary Next.js SDK: `npx ctx7 docs cloudinary "Next.js upload widget and image optimization"`
- React Dropzone for file uploads: `npx ctx7 library react-dropzone "file upload with drag and drop"`

## Agent Skills To Use

- `.agents/skills/next-best-practices/SKILL.md`
- `.agents/skills/shadcn/SKILL.md` for UI components
- `.agents/skills/context7-cli/SKILL.md` for Cloudinary integration research

## Files Owned

### New Files
- `components/chat/FileUpload.tsx`
- `components/chat/MediaPreview.tsx`
- `components/chat/ChatMessageList.tsx`
- `components/chat/ChatInput.tsx`
- `lib/cloudinary/upload.ts`
- `lib/cloudinary/client.ts`
- `app/api/media/upload/route.ts`

### Modified Files
- `components/chat/DiscoveryChat.tsx` — Complete redesign
- `components/chat/ChatMessage.tsx` — Add media support
- `prisma/schema.prisma` — Add media attachment fields
- `app/(app)/projects/[projectId]/discovery/page.tsx` — Fix layout scrolling

---

## Problem

### Current UI Issues:

1. **Scrolling is broken** — The entire page scrolls including sidebar and header. Should be: sidebar/header fixed, only chat messages scroll.

2. **No file upload** — Users can't share screenshots, design mockups, wireframes, inspiration images, or documents during discovery.

3. **No auto-scroll** — When a new message arrives, the UI doesn't scroll to show it. User manually scrolls down.

4. **No media storage plan** — If file uploads were added, where do they go? Vercel Blob has limits and costs.

5. **No session memory** — Chat context isn't efficiently managed. Long sessions hit context limits and lose earlier messages.

6. **Plain, dated UI** — The current chat doesn't feel premium. It looks like a basic message list, not a professional AI interface.

### User Impact:

- Designer can't share wireframe screenshot to show what they want
- User describing "a landing page like X" can't upload screenshot of X
- Long discovery sessions scroll forever with no visual organization
- No indication of file support, so users paste descriptions instead of showing

---

## Solution

### 1. Fixed Layout Architecture

```
┌─────────────────────────────────────────────┐
│  Header (fixed)                              │ ← Never scrolls
├──────────┬──────────────────────────────────┤
│ Sidebar  │  Chat Messages (scrollable)      │
│ (fixed)  │  ↕                                │ ← Only this area scrolls
│          │  User message                     │
│          │  AI message                       │
│          │  User message with image          │
│          │  ...                              │
│          ├──────────────────────────────────┤
│          │  Chat Input (fixed at bottom)    │ ← Sticky at bottom of viewport
└──────────┴──────────────────────────────────┘
```

### 2. File Upload via Cloudinary

**Why Cloudinary:**
- Generous free tier (25GB storage, 25GB bandwidth/month)
- Automatic image optimization and responsive delivery
- Video support with on-the-fly transformations
- CDN included
- Better economics than Vercel Blob for media-heavy use

**Upload Flow:**
1. User clicks attachment icon or drags file into chat
2. File validated client-side (type, size)
3. Upload to Cloudinary via signed upload widget
4. Cloudinary URL saved to DB with message
5. AI can "see" images (vision model) or reference documents

**Supported File Types:**
- Images: JPG, PNG, GIF, WEBP, SVG (up to 10MB)
- Documents: PDF, DOCX, TXT, MD (up to 5MB)
- Videos: MP4, WEBM, MOV (up to 50MB)
- Design files: Figma links, Sketch files (via URL reference)

### 3. Premium Chat UI

**Message Display:**
- User messages: right-aligned, dark background (#2a2a2a), green accent border-left
- AI messages: left-aligned, slightly lighter background (#1f1f1f)
- Timestamps: subtle, 11px, gray
- Avatar: user initial or AI icon
- Markdown support: code blocks, lists, bold, italic, links
- Media attachments: embedded preview with lightbox on click

**Input Area:**
- Multi-line textarea that expands up to 5 lines
- File attachment button (paperclip icon)
- Send button (green accent, #00e676)
- Keyboard shortcut: Cmd/Ctrl+Enter to send
- Typing indicator when AI is responding

**Auto-Scroll Behavior:**
- On new message: smooth scroll to bottom
- If user scrolled up: show "New message" badge, don't auto-scroll (respect user intent)
- "Scroll to bottom" button appears when not at bottom

### 4. Context Management

**Session Summarization:**
- Every 10 messages, run lightweight summarization (DeepSeek)
- Store summary alongside messages
- When context approaches limit, send summary + recent messages instead of full history
- Preserve media references in summary

**Memory Optimization:**
- Message limit: 50 per phase before compaction
- Compaction: Keep first 5 (initial prompt), last 20 (recent context), summarize middle
- Images: Store Cloudinary URL, not base64 in messages
- Documents: Extract text on upload, store extracted text separately

---

## Technical Design

### 1. Cloudinary Setup

```bash
npm install cloudinary cloudinary-react next-cloudinary
```

```typescript
// lib/cloudinary/client.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };
```

```typescript
// lib/cloudinary/upload.ts
import { cloudinary } from './client';

export async function generateUploadSignature() {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = `foundrie/${process.env.NODE_ENV}`;
  
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder,
    },
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder,
  };
}

export function getOptimizedImageUrl(publicId: string, width: number = 800) {
  return cloudinary.url(publicId, {
    transformation: [
      { width, crop: 'limit' },
      { quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  });
}
```

### 2. Database Schema

```prisma
model ConversationMessage {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  role        MessageRole
  content     String   @db.Text
  phaseId     String?
  metadata    Json?
  attachments Attachment[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([projectId, createdAt])
}

model Attachment {
  id              String   @id @default(cuid())
  messageId       String
  message         ConversationMessage @relation(fields: [messageId], references: [id], onDelete: Cascade)
  type            AttachmentType
  cloudinaryId    String   // Cloudinary public_id
  cloudinaryUrl   String   // Full URL
  originalName    String
  mimeType        String
  sizeBytes       Int
  width           Int?     // For images/videos
  height          Int?     // For images/videos
  extractedText   String?  @db.Text // For PDFs, docs
  createdAt       DateTime @default(now())

  @@index([messageId])
}

enum AttachmentType {
  IMAGE
  DOCUMENT
  VIDEO
  DESIGN_FILE
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}
```

### 3. File Upload Component

```typescript
// components/chat/FileUpload.tsx
'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  onUploadComplete: (url: string, metadata: AttachmentMetadata) => void;
  maxSizeMB?: number;
  accept?: Record<string, string[]>;
}

interface AttachmentMetadata {
  cloudinaryId: string;
  cloudinaryUrl: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  type: 'image' | 'document' | 'video';
  width?: number;
  height?: number;
}

export function FileUpload({ 
  onUploadComplete, 
  maxSizeMB = 10,
  accept = {
    'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt'],
    'text/markdown': ['.md'],
  }
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File too large. Max size: ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);

    try {
      // Get upload signature from API
      const sigResponse = await fetch('/api/media/upload/signature');
      const { signature, timestamp, cloudName, apiKey, folder } = await sigResponse.json();

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp.toString());
      formData.append('api_key', apiKey);
      formData.append('folder', folder);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const result = await uploadResponse.json();

      // Determine attachment type
      const type = file.type.startsWith('image/') 
        ? 'image' 
        : file.type.startsWith('video/') 
        ? 'video' 
        : 'document';

      const metadata: AttachmentMetadata = {
        cloudinaryId: result.public_id,
        cloudinaryUrl: result.secure_url,
        originalName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        type,
        width: result.width,
        height: result.height,
      };

      onUploadComplete(result.secure_url, metadata);
      setPreview(null);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [maxSizeMB, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors
        ${isDragActive ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50'}
        ${uploading ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2 text-center">
        {uploading ? (
          <>
            <Upload className="h-8 w-8 animate-bounce text-accent" />
            <p className="text-sm text-muted">Uploading...</p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted" />
            <p className="text-sm text-text">
              {isDragActive ? 'Drop file here' : 'Click or drag file to upload'}
            </p>
            <p className="text-xs text-muted">
              Images, PDFs, docs (max {maxSizeMB}MB)
            </p>
          </>
        )}
      </div>
    </div>
  );
}
```

### 4. Enhanced Chat Layout

```typescript
// app/(app)/projects/[projectId]/discovery/page.tsx

export default async function DiscoveryPage({ params }: { params: { projectId: string } }) {
  const project = await db.project.findUnique({
    where: { id: params.projectId },
    include: {
      conversationMessages: {
        include: { attachments: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!project) notFound();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Fixed */}
      <aside className="w-64 border-r border-border flex-shrink-0 bg-surface">
        <ProjectPhaseNav project={project} />
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-screen">
        {/* Header - Fixed */}
        <header className="h-16 border-b border-border flex items-center px-6 flex-shrink-0 bg-surface">
          <div>
            <h1 className="font-semibold text-lg">{project.name}</h1>
            <p className="text-sm text-muted">
              Phase {project.currentPhase} — {getPhaseLabel(project.currentPhase)}
            </p>
          </div>
        </header>

        {/* Messages - Scrollable */}
        <ChatMessageList
          messages={project.conversationMessages}
          projectId={project.id}
        />

        {/* Input - Fixed at Bottom */}
        <ChatInput projectId={project.id} />
      </main>
    </div>
  );
}
```

```typescript
// components/chat/ChatMessageList.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { ChatMessage } from './ChatMessage';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';

export function ChatMessageList({ messages, projectId }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  // Auto-scroll on new message if user is at bottom
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messages.length, isAtBottom]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAtBottom(atBottom);
    setShowScrollButton(!atBottom);
  };

  return (
    <div className="flex-1 relative overflow-hidden">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-6 py-4 space-y-4"
      >
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <Button
          onClick={scrollToBottom}
          size="icon"
          className="absolute bottom-4 right-4 rounded-full shadow-lg"
          variant="default"
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
```

### 5. Chat Input with File Support

```typescript
// components/chat/ChatInput.tsx
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Send, X } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { MediaPreview } from './MediaPreview';

export function ChatInput({ projectId }: { projectId: string }) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<AttachmentMetadata[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!content.trim() && attachments.length === 0) return;

    setSending(true);

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          content,
          attachments,
        }),
      });

      if (response.ok) {
        setContent('');
        setAttachments([]);
        setShowUpload(false);
      }
    } catch (error) {
      console.error('Failed to send:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border p-4 flex-shrink-0 bg-surface">
      {/* Upload Area */}
      {showUpload && (
        <div className="mb-4">
          <FileUpload
            onUploadComplete={(url, metadata) => {
              setAttachments([...attachments, metadata]);
              setShowUpload(false);
            }}
          />
        </div>
      )}

      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {attachments.map((att, i) => (
            <MediaPreview
              key={i}
              attachment={att}
              onRemove={() => setAttachments(attachments.filter((_, idx) => idx !== i))}
            />
          ))}
        </div>
      )}

      {/* Input Row */}
      <div className="flex gap-2 items-end">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowUpload(!showUpload)}
          className="flex-shrink-0"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (Cmd/Ctrl+Enter to send)"
          className="flex-1 min-h-[48px] max-h-[200px] resize-none"
          rows={1}
        />

        <Button
          onClick={handleSend}
          disabled={sending || (!content.trim() && attachments.length === 0)}
          size="icon"
          className="flex-shrink-0 bg-accent hover:bg-accent/90"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>

      <p className="text-xs text-muted mt-2">
        Cmd/Ctrl+Enter to send • {attachments.length > 0 ? `${attachments.length} file(s) attached` : 'Upload images, PDFs, or documents'}
      </p>
    </div>
  );
}
```

---

## Acceptance Criteria

1. ✅ Sidebar and header are `position: fixed`, only chat message area scrolls
2. ✅ New messages trigger smooth scroll to bottom if user is at bottom
3. ✅ If user scrolled up, "Scroll to bottom" button appears
4. ✅ File upload button opens drag-and-drop upload area
5. ✅ Accepted file types: images (10MB), documents (5MB), videos (50MB)
6. ✅ Files upload to Cloudinary, URL saved to `attachments` table
7. ✅ Image attachments display inline in chat with preview
8. ✅ Document attachments show file icon + name, clickable to open
9. ✅ AI can reference uploaded images in responses ("I see in your screenshot...")
10. ✅ Cmd/Ctrl+Enter sends message
11. ✅ Textarea expands up to 5 lines, then scrolls
12. ✅ Sending state disables input and shows loading indicator

---

## Out of Scope

- Image annotation/markup tools (future: Feature 67)
- Voice message recording (future: Feature 68)
- Real-time collaborative cursor (Liveblocks presence)
- Message editing after send (Discord-style)
- Message reactions/emoji (Slack-style)

---

## Future Modifications

When Feature 67 (Image Annotation) ships:
- Add drawing tools to annotate screenshots before sending
- Store annotations as Cloudinary overlays

When Feature 68 (Voice Messages) ships:
- Add microphone button
- Record audio, upload as Cloudinary video/audio asset

---

## Security Considerations

- Cloudinary upload signatures generated server-side only
- Signed URLs expire after 1 hour
- File type validation on both client and Cloudinary side
- Size limits enforced before upload starts
- Uploaded files scoped to project folder: `foundrie/{env}/{projectId}/`
- Row-level security: only project owner can see attachments

---

## For any technology, tool, or package we are using in this spec:

### Cloudinary Setup
1. Create free account at https://cloudinary.com
2. Get Cloud Name, API Key, API Secret from dashboard
3. Add to `.env.local`:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### React Dropzone
```bash
npm install react-dropzone
```
Standard drag-and-drop library for file uploads. Documentation: https://react-dropzone.js.org/
