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

**Folder Organization:**

Files are automatically organized by project and media type:

```text
Foundrie AI Files/
  ├── {projectId}/
  │   ├── images/       (JPG, PNG, GIF, WebP, SVG)
  │   ├── videos/       (MP4, WebM, MOV)
  │   ├── markdown/     (MD files)
  │   └── documents/    (PDF, DOCX, TXT, etc.)
```

The `mimeType` passed during upload automatically determines the subfolder:
- `image/*` → `images/`
- `video/*` → `videos/`
- `text/markdown` → `markdown/`
- All other documents → `documents/`

**Upload Flow:**
1. User clicks attachment icon or drags file into chat
2. File validated client-side (type, size)
3. Component requests signed upload signature from `/api/media/upload` with `projectId` and `mimeType`
4. Server generates signature with project-specific folder path
5. File uploads directly to Cloudinary into the appropriate subfolder
6. Cloudinary URL saved to DB with message
7. AI can "see" images (vision model) or reference documents

**Supported File Types:**
- Images: JPG, PNG, GIF, WEBP, SVG (up to 10MB)
- Documents: PDF, DOCX, TXT, MD (up to 5MB)
- Videos: MP4, WEBM, MOV (up to 50MB)
- Design files: Figma links, Sketch files (via URL reference)

**Note:** Folder routing is based solely on MIME type (`file.type`). Most browsers correctly report `text/markdown` for `.md` files, but some may report `text/plain`, causing markdown files to be stored in the `documents/` folder. This is acceptable as the functional behavior (storage, retrieval, download) is identical; only the organizational folder differs.

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

/**
 * Determine media type subfolder based on MIME type.
 * Organizes uploads into images/, videos/, markdown/, or documents/
 */
function getMediaTypeFolder(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'images';
  if (mimeType.startsWith('video/')) return 'videos';
  if (mimeType === 'text/markdown' || mimeType.endsWith('.md')) return 'markdown';
  // PDFs, Word docs, text files, etc.
  return 'documents';
}

/**
 * Generate upload signature for secure client-side uploads.
 * 
 * Folder structure: Foundrie AI Files/{projectId}/{mediaType}/
 * - Images → Foundrie AI Files/{projectId}/images/
 * - Videos → Foundrie AI Files/{projectId}/videos/
 * - Markdown → Foundrie AI Files/{projectId}/markdown/
 * - Documents → Foundrie AI Files/{projectId}/documents/
 */
export async function generateUploadSignature(
  projectId: string,
  mimeType?: string
) {
  const timestamp = Math.round(Date.now() / 1000);
  
  // Organize files by project and media type
  // If mimeType is provided, use specific subfolder; otherwise use root project folder
  let folder = `Foundrie AI Files/${projectId}`;
  if (mimeType) {
    const mediaTypeFolder = getMediaTypeFolder(mimeType);
    folder = `${folder}/${mediaTypeFolder}`;
  }
  
  // Validate required environment variable
  if (!process.env.CLOUDINARY_API_SECRET) {
    throw new Error('CLOUDINARY_API_SECRET is not configured');
  }
  
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder,
    },
    process.env.CLOUDINARY_API_SECRET
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
// Individual message in a conversation (Feature 54).
model ConversationMessage {
  id             String       @id @default(cuid())
  conversationId String
  projectId      String       // Denormalized for query performance
  role           MessageRole
  content        String       @db.Text
  phaseId        String?
  metadata       Json?

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  project      Project       @relation("conversationMessages", fields: [projectId], references: [id], onDelete: Cascade)
  attachments  Attachment[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([conversationId, createdAt])
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

**Schema Notes:**
- `ConversationMessage.projectId` has a foreign key constraint to `Project` for data integrity
- Queries fetching conversation messages include a `take: 200` limit to prevent unbounded result sets
- The `AttachmentType` enum is used throughout for type safety (no raw strings)

### 3. File Upload Component

```typescript
// components/chat/FileUpload.tsx
'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  projectId: string;
  onUploadComplete: (metadata: AttachmentMetadata) => void;
  onCancel?: () => void;
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
  projectId,
  onUploadComplete, 
  onCancel,
  maxSizeMB = 10,
  accept = {
    'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt'],
    'text/markdown': ['.md'],
    'video/mp4': ['.mp4'],
    'video/webm': ['.webm'],
    'video/quicktime': ['.mov'],
  }
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError(null);

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large. Max size: ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      // Get upload signature from API (includes project auth check)
      const sigResponse = await fetch('/api/media/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId,
          mimeType: file.type, // Pass mimeType for folder organization
        }),
      });

      if (!sigResponse.ok) {
        throw new Error('Failed to get upload signature');
      }

      const { signature, timestamp, cloudName, apiKey, folder } = await sigResponse.json();
      setProgress(20);

      // Upload to Cloudinary with XMLHttpRequest for real progress tracking
      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp.toString());
      formData.append('api_key', apiKey);
      formData.append('folder', folder);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

      // Use XMLHttpRequest for upload progress events
      const result = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 80) + 20; // 20-100%
            setProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (e) {
              reject(new Error('Invalid response from Cloudinary'));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'));
        });

        xhr.open('POST', uploadUrl);
        xhr.send(formData);
      });

      setProgress(100);

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

      onUploadComplete(metadata);
    } catch (error) {
      console.error('Upload failed:', error);
      setError(error instanceof Error ? error.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [projectId, maxSizeMB, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
    multiple: false,
    disabled: uploading,
    onDropRejected: (rejections) => {
      const rejection = rejections[0];
      if (!rejection) return;

      const errors = rejection.errors.map(e => e.message).join(', ');
      setError(`File rejected: ${errors}`);
    },
  });

  return (
    <div className="border border-border rounded-lg p-4 bg-surface">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors
          ${isDragActive ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50'}
          ${uploading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3 text-center">
          {uploading ? (
            <>
              <Upload className="h-10 w-10 animate-bounce text-accent" />
              <div className="w-full max-w-xs">
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-muted mt-2">Uploading... {progress}%</p>
              </div>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted" />
              <div>
                <p className="text-sm text-text">
                  {isDragActive ? 'Drop file here' : 'Click or drag file to upload'}
                </p>
                <p className="text-xs text-muted mt-1">
                  Images, PDFs, videos, docs (max {maxSizeMB}MB)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {onCancel && !uploading && (
        <div className="mt-3 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
```

**FileUpload Notes:**
- Uses XMLHttpRequest instead of fetch to enable real upload progress tracking
- Includes `onDropRejected` handler to surface file rejection errors to users
- Server-side authorization check via `/api/media/upload` which validates project membership
- Progress bar accurately reflects upload state (20-100% based on actual bytes transferred)

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
  const prevMessageCountRef = useRef(messages.length);
  const prevLastContentRef = useRef('');

  const scrollToBottom = (smooth = true) => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  // Auto-scroll on new message or streaming content if user is at bottom
  useEffect(() => {
    const newMessageAdded = messages.length > prevMessageCountRef.current;
    const lastMessage = messages[messages.length - 1];
    const lastContent = lastMessage?.content || '';
    const contentChanged = lastContent !== prevLastContentRef.current;
    
    prevMessageCountRef.current = messages.length;
    prevLastContentRef.current = lastContent;

    if ((newMessageAdded || contentChanged) && isAtBottom) {
      // Small delay to ensure DOM has updated
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [messages, isAtBottom]);

  // Initial scroll to bottom
  useEffect(() => {
    scrollToBottom(false);
  }, []);

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
          onClick={() => scrollToBottom()}
          size="icon"
          className="absolute bottom-4 right-4 rounded-full shadow-lg bg-accent hover:bg-accent/90"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
```

**ChatMessageList Notes:**
- Auto-scroll now tracks both message count changes AND last message content changes
- This ensures streaming responses trigger auto-scroll as content grows
- ChatMessage component is wrapped in React.memo for performance (prevents re-rendering unchanged messages)
- Scroll-to-bottom button includes `aria-label` for accessibility

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
            projectId={projectId}
            onUploadComplete={(metadata) => {
              setAttachments([...attachments, metadata]);
              setShowUpload(false);
            }}
            onCancel={() => setShowUpload(false)}
          />
        </div>
      )}

      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {attachments.map((att) => (
            <MediaPreview
              key={att.cloudinaryId}
              attachment={att}
              size="sm"
              onRemove={() => setAttachments(attachments.filter((a) => a.cloudinaryId !== att.cloudinaryId))}
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
          disabled={sending}
          aria-label="Attach file"
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
          disabled={sending}
        />

        <Button
          onClick={handleSend}
          disabled={sending || (!content.trim() && attachments.length === 0)}
          size="icon"
          className="flex-shrink-0 bg-accent hover:bg-accent/90"
          aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>

      <p className="text-xs text-muted mt-2">
        {sending ? 'Sending...' : (
          <>
            Cmd/Ctrl+Enter to send • {attachments.length > 0 ? `${attachments.length} file(s) attached` : 'Upload images, PDFs, or documents'}
          </>
        )}
      </p>
    </div>
  );
}
```

**ChatInput Notes:**
- Attachment previews use `att.cloudinaryId` as stable React key instead of array index
- Paperclip and Send buttons include `aria-label` for accessibility
- File removal uses cloudinaryId matching instead of index-based filtering

---

### 6. Media Preview and Shared Utilities

```typescript
// lib/format.ts
/**
 * File formatting utilities (Feature 54).
 * Shared helpers for consistent file size and media display formatting.
 */

/**
 * Format bytes to human-readable file size.
 * Returns B, KB, or MB depending on magnitude.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
```

```typescript
// components/chat/MediaPreview.tsx
'use client';

import { X, File, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/format';
import type { AttachmentMetadata } from './FileUpload';

interface MediaPreviewProps {
  attachment: AttachmentMetadata;
  onRemove?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function MediaPreview({ attachment, onRemove, size = 'md' }: MediaPreviewProps) {
  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
  };

  const iconSize = size === 'sm' ? 'h-6 w-6' : size === 'md' ? 'h-8 w-8' : 'h-10 w-10';

  const getFileIcon = () => {
    switch (attachment.type) {
      case 'image':
        return <ImageIcon className={iconSize} />;
      case 'document':
        return attachment.mimeType === 'application/pdf' ? (
          <FileText className={iconSize} />
        ) : (
          <File className={iconSize} />
        );
      default:
        return <File className={iconSize} />;
    }
  };

  return (
    <div className="relative group">
      <div
        className={`
          ${sizeClasses[size]} rounded-lg border border-border overflow-hidden
          bg-surface-secondary flex items-center justify-center
        `}
      >
        {attachment.type === 'image' ? (
          <img
            src={attachment.cloudinaryUrl}
            alt={attachment.originalName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-2 text-center">
            {getFileIcon()}
          </div>
        )}
      </div>

      {/* File info overlay */}
      <div className="mt-1 text-xs text-muted truncate max-w-[120px]">
        <p className="truncate">{attachment.originalName}</p>
        <p>{formatFileSize(attachment.sizeBytes)}</p>
      </div>

      {/* Remove button */}
      {onRemove && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onRemove}
          aria-label={`Remove ${attachment.originalName}`}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
```

**MediaPreview Notes:**
- Uses shared `formatFileSize` utility from `lib/format.ts` for consistent B/KB/MB formatting
- Remove button includes `aria-label` with attachment name for accessibility
- Correctly distinguishes between PDF (FileText icon) and other documents (generic File icon)

---

### 7. Enhanced ChatMessage Component

```typescript
// components/chat/ChatMessage.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { Bot, User, FileText, File as FileIcon, Image as ImageIcon } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '@/lib/conversations/chat';
import ReactMarkdown from 'react-markdown';
import { formatFileSize } from '@/lib/format';

interface ChatMessageProps {
  message: ChatMessageType & {
    attachments?: Array<{
      id: string;
      type: 'image' | 'document' | 'video';
      cloudinaryUrl: string;
      originalName: string;
      sizeBytes: number;
      width?: number;
      height?: number;
    }>;
  };
}

export const ChatMessage = React.memo(function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  const renderAttachment = (attachment: NonNullable<ChatMessageProps['message']['attachments']>[0]) => {
    if (attachment.type === 'image') {
      return (
        <a
          href={attachment.cloudinaryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-2 rounded-lg overflow-hidden border border-border hover:opacity-90 transition-opacity"
        >
          <img
            src={attachment.cloudinaryUrl}
            alt={attachment.originalName}
            className="max-w-full h-auto max-h-[400px] object-contain"
          />
        </a>
      );
    }

    if (attachment.type === 'video') {
      return (
        <div className="mt-2 rounded-lg overflow-hidden border border-border">
          <video
            src={attachment.cloudinaryUrl}
            controls
            className="max-w-full h-auto max-h-[400px]"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    // Document attachment - use correct icon for non-PDF documents
    const icon = attachment.originalName.endsWith('.pdf') ? (
      <FileText className="h-5 w-5" />
    ) : (
      <FileIcon className="h-5 w-5" />
    );

    return (
      <a
        href={attachment.cloudinaryUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-surface-secondary transition-colors"
      >
        {icon}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{attachment.originalName}</p>
          <p className="text-xs text-muted">
            {formatFileSize(attachment.sizeBytes)}
          </p>
        </div>
      </a>
    );
  };

  return (
    <div
      className={cn(
        'flex w-full items-start gap-4 py-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow-sm',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          'flex min-w-[120px] max-w-[80%] flex-col gap-2 rounded-lg px-4 py-3 text-sm',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
        )}
      >
        <div className="prose prose-sm dark:prose-invert break-words">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>

        {/* Render attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="space-y-2">
            {message.attachments.map((attachment) => (
              <div key={attachment.id}>{renderAttachment(attachment)}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
```

**ChatMessage Notes:**
- Wrapped in `React.memo` to prevent unnecessary re-renders during streaming
- Uses shared `formatFileSize` utility for consistent file size display
- Non-PDF documents now correctly use `FileIcon` instead of `FileVideo`
- Removed unused `isStreaming` prop

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
- Uploaded files scoped to project folder: `Foundrie AI Files/{projectId}/{mediaType}/`
- Each media type isolated in its own subfolder for organization
- Application-layer authorization: only project members can see attachments
- MIME type validation prevents malicious file uploads disguised as allowed types

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

---

## Implementation Notes (CodeRabbit Review Fixes)

The following improvements were applied during implementation to ensure production quality:

### Performance Optimizations
- **ChatMessage memoization**: Wrapped in `React.memo` to prevent re-rendering unchanged messages during streaming
- **Stable React keys**: Attachment previews use `cloudinaryId` instead of array index to prevent DOM state mismatches
- **Query pagination**: Message history queries limited to 200 messages to prevent unbounded result sets

### Type Safety
- **Typed attachments**: `IncomingAttachment` interface uses Prisma `AttachmentType` enum instead of string literals
- **Typed message fetching**: DiscoveryChat message normalization uses proper `Message` type instead of `any`

### User Experience
- **Real upload progress**: FileUpload uses `XMLHttpRequest.upload.onprogress` for accurate progress tracking (20-100%)
- **File rejection feedback**: `onDropRejected` handler surfaces validation errors when files are rejected
- **Streaming auto-scroll**: ChatMessageList tracks both message count AND last message content for smooth streaming UX
- **Correct file icons**: Non-PDF documents use `FileIcon` instead of incorrect `FileVideo` icon

### Accessibility
- All icon-only buttons include `aria-label` attributes:
  - Paperclip button: `aria-label="Attach file"`
  - Send button: `aria-label="Send message"`
  - Scroll-to-bottom button: `aria-label="Scroll to bottom"`
  - Remove attachment button: `aria-label="Remove {filename}"`

### Data Integrity
- **Foreign key constraint**: `ConversationMessage.projectId` has FK to `Project` for referential integrity
- **Environment validation**: `CLOUDINARY_API_SECRET` explicitly validated before signing uploads

### Shared Utilities
- **File size formatting**: Created `lib/format.ts` with `formatFileSize()` used by both `MediaPreview` and `ChatMessage` for consistent B/KB/MB display

### Authorization
- Upload route already includes `requireProjectMember()` check before generating Cloudinary signatures
- Chat persistence uses best-effort error handling with detailed logging (legacy JSON remains source of truth)
