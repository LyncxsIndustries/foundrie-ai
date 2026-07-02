# UI Registry

## Contract Synchronization Gate

Any implementation change that corrects or changes a contract must be reflected in the same branch across the affected feature spec, dependent future specs, relevant context files, root AGENTS.md, and progress-tracker.md. Contracts include Prisma fields and relations, route signatures, auth helper signatures, AI task names and callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, and file ownership. A feature is not ready for review while later specs or context still describe stale fields, old API shapes, or invalid contracts.

## Purpose

This document catalogs all UI components in Foundrie AI, their props, usage patterns, and when to use each component. This is the single source of truth for the component library.

## Component Categories

1. **Primitives** — Low-level shadcn/ui components (Button, Input, Dialog)
2. **Layout** — Page structure components (AppShell, TopBar, Sidebar)
3. **Forms** — Form inputs and validation wrappers
4. **Data Display** — Tables, lists, cards, metrics
5. **Feedback** — Loading, errors, empty states, toasts
6. **Navigation** — Menus, tabs, breadcrumbs
7. **Media** — Images, videos, file uploads
8. **Discovery** — Chat interface components
9. **Canvas** — Diagram workspace components

---

## Primitives (shadcn/ui)

### Button

**Location:** `components/ui/button.tsx`

**Variants:**
- `default` — Primary action (green background)
- `secondary` — Secondary action (gray background)
- `outline` — Outlined button
- `ghost` — Transparent, hover background
- `link` — Text-only, no background
- `destructive` — Dangerous action (red)

**Sizes:** `default`, `sm`, `lg`, `icon`

**Usage:**

```tsx
import { Button } from '@/components/ui/button';

<Button variant="default" size="lg">
  Create Project
</Button>

<Button variant="outline" size="sm">
  Cancel
</Button>

<Button variant="destructive" onClick={handleDelete}>
  Delete
</Button>
```

**With Loading State:**

```tsx
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Saving...
    </>
  ) : (
    'Save Changes'
  )}
</Button>
```

---

### Input

**Location:** `components/ui/input.tsx`

**Usage:**

```tsx
import { Input } from '@/components/ui/input';

<Input
  type="email"
  placeholder="you@example.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

**With Form Field:**

```tsx
<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <Input type="email" placeholder="you@example.com" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

### Textarea

**Location:** `components/ui/textarea.tsx`

**Usage:**

```tsx
import { Textarea } from '@/components/ui/textarea';

<Textarea
  placeholder="Describe your project..."
  rows={4}
  value={description}
  onChange={(e) => setDescription(e.target.value)}
/>
```

---

### Dialog (Modal)

**Location:** `components/ui/dialog.tsx`

**Usage:**

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Deletion</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    
    <div className="py-4">
      {/* Content */}
    </div>
    
    <DialogFooter>
      <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button variant="destructive" onClick={handleDelete}>Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### Select (Dropdown)

**Location:** `components/ui/select.tsx`

**Usage:**

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

<Select value={value} onValueChange={setValue}>
  <SelectTrigger className="w-full">
    <SelectValue placeholder="Select a category" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="inspiration">Inspiration</SelectItem>
    <SelectItem value="wireframes">Wireframes</SelectItem>
    <SelectItem value="branding">Branding</SelectItem>
  </SelectContent>
</Select>
```

---

### Skeleton

**Location:** `components/ui/skeleton.tsx`

**Usage:**

```tsx
import { Skeleton } from '@/components/ui/skeleton';

// Loading state for cards
{isLoading ? (
  <div className="space-y-4">
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-24 w-full" />
  </div>
) : (
  <ContentList items={items} />
)}
```

---

## Layout Components

### AppShell

**Location:** `components/layout/AppShell.tsx`

**Purpose:** Root layout wrapper with fixed header, sidebar, and scrolling content.

**Usage:**

```tsx
import { AppShell } from '@/components/layout/AppShell';

export default function DashboardLayout({ children }) {
  return (
    <AppShell>
      {children}
    </AppShell>
  );
}
```

---

### TopBar

**Location:** `components/layout/TopBar.tsx`

**Purpose:** Fixed header with logo, navigation, and user menu.

**Props:**
- `showProjectName?: boolean` — Display current project name
- `projectName?: string`

**Usage:**

```tsx
<TopBar showProjectName projectName="My Project" />
```

---

### Sidebar

**Location:** `components/layout/Sidebar.tsx`

**Purpose:** Fixed left sidebar with navigation links.

**Props:**
- `activeRoute: string` — Current active route

**Usage:**

```tsx
<Sidebar activeRoute="/dashboard" />
```

---

## Media Components

### FileUploadZone

**Location:** `components/discovery/FileUploadZone.tsx`

**Purpose:** Drag-and-drop file upload with Cloudinary integration.

**Props:**
- `projectId: string` — Required for file association
- `onUploadSuccess?: (file: ResearchFile) => void` — Callback after successful upload
- `maxFiles?: number` — Default 10
- `acceptedTypes?: string[]` — MIME types, default: images, videos, documents

**Usage:**

```tsx
import { FileUploadZone } from '@/components/discovery/FileUploadZone';

<FileUploadZone
  projectId={project.id}
  onUploadSuccess={(file) => {
    console.log('Uploaded:', file);
    toast.success('File uploaded successfully');
  }}
  maxFiles={5}
/>
```

**Features:**
- Drag-and-drop interface
- File type and size validation
- Upload progress indicator
- Cloudinary signed upload
- Auto-saves metadata to database

---

### UploadedFileCard

**Location:** `components/discovery/UploadedFileCard.tsx`

**Purpose:** Display uploaded file with thumbnail, metadata, and actions.

**Props:**
- `file: ResearchFile` — File metadata
- `onDelete?: (fileId: string) => void` — Delete handler
- `onCategoryChange?: (fileId: string, category: string) => void`

**Usage:**

```tsx
import { UploadedFileCard } from '@/components/discovery/UploadedFileCard';

<UploadedFileCard
  file={file}
  onDelete={handleDelete}
  onCategoryChange={handleCategoryChange}
/>
```

**Features:**
- Image/video thumbnails
- Document icons
- Category tag selector
- Delete confirmation
- File size and upload date display

---

### MediaGallery

**Location:** `components/research/MediaGallery.tsx`

**Purpose:** Grid view of all uploaded media with filtering and lightbox.

**Props:**
- `projectId: string` — Project to display files for
- `category?: string` — Filter by category
- `onFileSelect?: (file: ResearchFile) => void`

**Usage:**

```tsx
import { MediaGallery } from '@/components/research/MediaGallery';

<MediaGallery
  projectId={project.id}
  category="wireframes"
  onFileSelect={(file) => console.log('Selected:', file)}
/>
```

**Features:**
- Responsive grid (1-3-4 columns)
- Category filter dropdown
- Search by filename or tags
- Lightbox modal for preview
- Bulk selection and delete

---

## Discovery Components

### ChatContainer

**Location:** `components/discovery/ChatContainer.tsx`

**Purpose:** Full chat interface with fixed header, scrolling messages, and input.

**Props:**
- `projectId: string`
- `messages: Message[]`
- `onSendMessage: (content: string) => void`
- `isLoading?: boolean`

**Usage:**

```tsx
import { ChatContainer } from '@/components/discovery/ChatContainer';

<ChatContainer
  projectId={project.id}
  messages={messages}
  onSendMessage={handleSendMessage}
  isLoading={isGenerating}
/>
```

**Layout:**
- Fixed ChatHeader (64px)
- Scrolling MessageList (flex-1)
- Fixed MessageInput (auto-height)

---

### MessageList

**Location:** `components/discovery/MessageList.tsx`

**Purpose:** Scrollable list of chat messages with auto-scroll.

**Props:**
- `messages: Message[]`
- `isLoading?: boolean` — Show typing indicator

**Usage:**

```tsx
<MessageList
  messages={messages}
  isLoading={isGenerating}
/>
```

**Features:**
- User/AI message bubbles
- Markdown rendering in AI messages
- Auto-scroll to bottom on new message
- Typing indicator animation

---

### MessageInput

**Location:** `components/discovery/MessageInput.tsx`

**Purpose:** Textarea input with auto-resize and send button.

**Props:**
- `onSend: (content: string) => void`
- `disabled?: boolean`
- `placeholder?: string`

**Usage:**

```tsx
<MessageInput
  onSend={handleSend}
  disabled={isGenerating}
  placeholder="Describe your project idea..."
/>
```

**Features:**
- Auto-resize textarea (1-6 rows)
- Shift+Enter for new line
- Enter to send
- Disabled state during generation

---

## Dashboard Components

### ProjectCard

**Location:** `components/dashboard/ProjectCard.tsx`

**Purpose:** Glass card displaying project summary with hover animation.

**Props:**
- `project: Project` — Project data
- `onOpen?: () => void`
- `onDelete?: () => void`

**Usage:**

```tsx
import { ProjectCard } from '@/components/dashboard/ProjectCard';

<ProjectCard
  project={project}
  onOpen={() => router.push(`/projects/${project.id}`)}
  onDelete={handleDelete}
/>
```

**Features:**
- Glass morphism background
- GSAP hover lift animation
- Status badge (draft, in-progress, complete)
- Quick actions dropdown
- Last updated timestamp

---

### EmptyState

**Location:** `components/dashboard/EmptyState.tsx`

**Purpose:** Display when no projects exist.

**Props:**
- `title: string`
- `description: string`
- `action?: ReactNode` — CTA button
- `icon?: LucideIcon`

**Usage:**

```tsx
import { EmptyState } from '@/components/dashboard/EmptyState';
import { FolderOpen } from 'lucide-react';

<EmptyState
  icon={FolderOpen}
  title="No projects yet"
  description="Get started by creating your first project."
  action={
    <Button onClick={() => router.push('/projects/new')}>
      <Plus className="mr-2 h-4 w-4" />
      New Project
    </Button>
  }
/>
```

---

## Project Components

### PhaseProgressBar

**Location:** `components/projects/PhaseProgressBar.tsx`

**Purpose:** Visual progress bar showing phase completion.

**Props:**
- `currentPhase: number` — 0-indexed
- `totalPhases: number`
- `confidence?: number` — 0-100, optional confidence score

**Usage:**

```tsx
<PhaseProgressBar
  currentPhase={3}
  totalPhases={8}
  confidence={85}
/>
```

**Features:**
- Animated progress bar (GSAP)
- Phase labels (1/8, 2/8, etc.)
- Confidence indicator (if provided)

---

### PhaseTimeline

**Location:** `components/projects/PhaseTimeline.tsx`

**Purpose:** Visual timeline showing past, current, and future phases.

**Props:**
- `phases: PhaseInfo[]` — Phase data
- `currentPhaseIndex: number`

**Usage:**

```tsx
<PhaseTimeline
  phases={[
    { name: 'Problem & Users', status: 'completed' },
    { name: 'Core Flows', status: 'completed' },
    { name: 'Architecture', status: 'in-progress' },
    { name: 'Feature Specs', status: 'pending' },
  ]}
  currentPhaseIndex={2}
/>
```

**Features:**
- Vertical timeline layout
- Color-coded status (green, blue, gray)
- Animated checkmarks for completed
- Current phase highlighted

---

### MetricsCard

**Location:** `components/projects/MetricsCard.tsx`

**Purpose:** Display key project metric with icon.

**Props:**
- `label: string`
- `value: number | string`
- `icon: LucideIcon`
- `trend?: 'up' | 'down'` — Optional trend indicator

**Usage:**

```tsx
<MetricsCard
  label="Messages Exchanged"
  value={42}
  icon={MessageCircle}
/>
```

---

## Feedback Components

### LoadingSpinner

**Location:** `components/ui/loading-spinner.tsx`

**Usage:**

```tsx
import { LoadingSpinner } from '@/components/ui/loading-spinner';

<LoadingSpinner size="lg" />
```

**Sizes:** `sm`, `md`, `lg`

---

### ErrorBoundary

**Location:** `components/shared/ErrorBoundary.tsx`

**Usage:**

```tsx
<ErrorBoundary FallbackComponent={ErrorFallback}>
  <YourComponent />
</ErrorBoundary>
```

---

### Toast Notifications

**Package:** `sonner`

**Usage:**

```tsx
import { toast } from 'sonner';

toast.success('Saved!');
toast.error('Failed to save');
toast.info('Processing...');
```

---

## Canvas Components

### DiagramCanvas

**Location:** `components/canvas/DiagramCanvas.tsx`

**Purpose:** React Flow canvas for diagram editing.

**Props:**
- `projectId: string`
- `nodes: Node[]`
- `edges: Edge[]`
- `onNodesChange: (changes) => void`
- `onEdgesChange: (changes) => void`

**Usage:**

```tsx
<DiagramCanvas
  projectId={project.id}
  nodes={nodes}
  edges={edges}
  onNodesChange={handleNodesChange}
  onEdgesChange={handleEdgesChange}
/>
```

---

## Usage Decision Tree

**Need a button?**
→ Use `Button` with appropriate variant

**Need an input field?**
→ Use `Input` or `Textarea` depending on expected length

**Need a modal?**
→ Use `Dialog` for important actions, `Popover` for contextual info

**Need to upload files?**
→ Use `FileUploadZone` for chat uploads, `MediaGallery` for managing uploads

**Need to show loading?**
→ Use `Skeleton` for content placeholders, `LoadingSpinner` for operations, button disabled state for actions

**Need to show errors?**
→ Use inline `FormMessage` for fields, `toast.error` for actions, `ErrorBoundary` for crashes

**Need to show empty state?**
→ Use `EmptyState` with clear CTA

**Need page layout?**
→ Wrap page in `AppShell`, content auto-scrolls

**Need navigation?**
→ Use `Sidebar` for app-level nav, `Tabs` for section-level nav

## Component Checklist

Before creating a new component, verify:
- [ ] No existing component solves this need
- [ ] Component is reusable (used in 2+ places)
- [ ] Props are typed with TypeScript
- [ ] Component is accessible (keyboard nav, ARIA)
- [ ] Component is responsive (mobile-first)
- [ ] Component has loading/error states if async
- [ ] Component is documented in this registry
