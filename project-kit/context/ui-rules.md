# UI Rules

## Contract Synchronization Gate

Any implementation change that corrects or changes a contract must be reflected in the same branch across the affected feature spec, dependent future specs, relevant context files, root AGENTS.md, and progress-tracker.md. Contracts include Prisma fields and relations, route signatures, auth helper signatures, AI task names and callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, and file ownership. A feature is not ready for review while later specs or context still describe stale fields, old API shapes, or invalid contracts.

## Purpose

This document defines layout patterns, interaction behaviors, and component usage rules for Foundrie AI. All UI components must follow these rules for consistency across the application.

## Fixed Scrolling Layout Pattern

Foundrie uses a fixed-header, fixed-sidebar, scrolling-content layout on all pages.

### Layout Structure

```
┌─────────────────────────────────────┐
│         TopBar (fixed)               │ ← 64px height, always visible
├──────┬──────────────────────────────┤
│      │                               │
│ Side │   Content Area (scrolls)     │
│ bar  │                               │
│      │   Only this region scrolls   │
│ (fix │   via overflow-y-auto        │
│ ed)  │                               │
│      │                               │
│      │                               │
└──────┴──────────────────────────────┘
```

### Implementation Rules

**1. AppShell Structure:**

```tsx
<div className="h-screen flex flex-col">
  {/* TopBar - Fixed */}
  <header className="h-16 border-b border-border flex-shrink-0">
    <TopBar />
  </header>

  <div className="flex-1 flex overflow-hidden">
    {/* Sidebar - Fixed */}
    <aside className="w-64 border-r border-border flex-shrink-0 overflow-y-auto">
      <Sidebar />
    </aside>

    {/* Main content - Scrollable */}
    <main className="flex-1 overflow-y-auto">
      {children}
    </main>
  </div>
</div>
```

**2. Scroll Container Rules:**
- Only `<main>` should have `overflow-y-auto`
- Never apply `overflow-y-auto` to `<html>` or `<body>`
- Sidebar can scroll independently if content exceeds viewport height
- Chat message lists scroll within their container, not the entire page

**3. Chat Scroll Behavior:**

```tsx
// Chat container structure
<div className="flex flex-col h-full">
  {/* Chat header - Fixed */}
  <div className="h-16 border-b border-border flex-shrink-0">
    <ChatHeader />
  </div>

  {/* Messages - Scrollable */}
  <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
    <MessageList messages={messages} />
  </div>

  {/* Input - Fixed at bottom */}
  <div className="border-t border-border flex-shrink-0">
    <MessageInput />
  </div>
</div>
```

**4. Auto-Scroll to Bottom:**

```typescript
// Auto-scroll when new message arrives
useEffect(() => {
  if (scrollRef.current) {
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }
}, [messages]);
```

## Loading States

Every async action must have a loading state:

### Button Loading

```tsx
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Loading...
    </>
  ) : (
    'Submit'
  )}
</Button>
```

### Skeleton Loaders

```tsx
// For lists of content
{isLoading ? (
  <div className="space-y-4">
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-24 w-full" />
  </div>
) : (
  <ProjectList projects={projects} />
)}
```

### Spinner Overlays

```tsx
// For full-page loading (use sparingly)
{isLoading && (
  <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
)}
```

## Error States

### Inline Errors (Form Fields)

```tsx
<Input
  {...field}
  aria-invalid={!!error}
  className={error ? 'border-error' : ''}
/>
{error && (
  <p className="text-sm text-error mt-1">{error.message}</p>
)}
```

### Toast Notifications

```tsx
import { toast } from 'sonner';

// Success
toast.success('Project created successfully');

// Error
toast.error('Failed to save changes', {
  description: 'Please try again or contact support.',
});

// Info
toast.info('Changes saved automatically');
```

### Error Boundaries

```tsx
// Wrap each route or major section
<ErrorBoundary
  FallbackComponent={ErrorFallback}
  onError={(error, info) => {
    console.error('Error boundary caught:', error, info);
  }}
>
  <YourComponent />
</ErrorBoundary>
```

## Empty States

### Guidelines
- Always show empty states when no data exists
- Include illustration or icon
- Provide clear call-to-action
- Explain why it's empty and what user can do

### Example

```tsx
{projects.length === 0 ? (
  <div className="flex flex-col items-center justify-center h-96 text-center">
    <FolderOpen className="h-16 w-16 text-muted mb-4" />
    <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
    <p className="text-secondary mb-6 max-w-md">
      Get started by creating your first project. Foundrie will guide you through
      the discovery process step by step.
    </p>
    <Button size="lg">
      <Plus className="mr-2 h-5 w-5" />
      New Project
    </Button>
  </div>
) : (
  <ProjectGrid projects={projects} />
)}
```

## Form Validation

### Real-time vs Submit Validation

- **Real-time**: Email format, password strength, username availability
- **On blur**: Field-level validation after user leaves field
- **On submit**: Final validation before API call

### Validation Feedback

```tsx
// Using react-hook-form + zod
const form = useForm({
  resolver: zodResolver(schema),
  mode: 'onBlur', // Validate on blur, not on every keystroke
});

<Form {...form}>
  <FormField
    control={form.control}
    name="projectName"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Project Name</FormLabel>
        <FormControl>
          <Input placeholder="My awesome project" {...field} />
        </FormControl>
        <FormDescription>
          Choose a descriptive name for your project
        </FormDescription>
        <FormMessage /> {/* Shows validation error */}
      </FormItem>
    )}
  />
</Form>
```

## Modal & Dialog Patterns

### Usage Rules
- **Modal**: Requires immediate action, blocks background interaction
- **Popover**: Contextual info, non-blocking, dismissed by clicking outside
- **Drawer**: Mobile-friendly alternative to sidebars, slides from edge

### Modal Best Practices

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Delete Project</DialogTitle>
      <DialogDescription>
        This action cannot be undone. This will permanently delete your project
        and remove all associated data.
      </DialogDescription>
    </DialogHeader>

    {/* Content */}
    <div className="py-4">
      <Input placeholder="Type project name to confirm" />
    </div>

    {/* Actions */}
    <DialogFooter>
      <Button variant="ghost" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button variant="destructive" onClick={handleDelete}>
        Delete Project
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Responsive Design Rules

### Mobile-First Approach

```tsx
// Start with mobile styles, add breakpoints for larger screens
<div className="
  grid grid-cols-1           // 1 col on mobile
  md:grid-cols-2             // 2 cols on tablet
  lg:grid-cols-3             // 3 cols on desktop
  gap-4
">
  {projects.map(project => <ProjectCard key={project.id} project={project} />)}
</div>
```

### Breakpoint Usage

| Breakpoint | Width | Use Case |
|---|---|---|
| `sm:` | ≥640px | Mobile landscape |
| `md:` | ≥768px | Tablet portrait |
| `lg:` | ≥1024px | Tablet landscape, small laptop |
| `xl:` | ≥1280px | Desktop |
| `2xl:` | ≥1536px | Large desktop |

### Touch Target Sizes

- **Minimum**: 44x44px for all interactive elements (WCAG 2.1 AA)
- **Recommended**: 48x48px for primary actions
- **Mobile**: Increase button padding on touch devices

```tsx
<Button className="min-h-[44px] px-6">
  Submit
</Button>
```

## Animation Rules

### When to Animate

✅ **Do animate:**
- Page/route transitions
- Modal/drawer entrances and exits
- Hover states (lift, glow, scale)
- Feedback for user actions (button press, form submission)
- Revealing new content (scroll-triggered)

❌ **Don't animate:**
- Loading spinners beyond simple rotation
- Every single element on page load (overwhelming)
- Animations longer than 500ms (feels sluggish)

### GSAP Animation Patterns

**Button Press:**

```typescript
const buttonRef = useRef<HTMLButtonElement>(null);

<button
  ref={buttonRef}
  onPointerDown={() => gsap.to(buttonRef.current, { scale: 0.95, duration: 0.1 })}
  onPointerUp={() => gsap.to(buttonRef.current, { scale: 1, duration: 0.2, ease: 'back.out(1.7)' })}
>
  Click me
</button>
```

**Card Hover Lift:**

```typescript
<div
  onMouseEnter={() => gsap.to(ref.current, { y: -4, duration: 0.2 })}
  onMouseLeave={() => gsap.to(ref.current, { y: 0, duration: 0.2 })}
  className="shadow-medium transition-shadow hover:shadow-high"
>
  Card content
</div>
```

**Scroll-Triggered Reveal:**

```typescript
useEffect(() => {
  gsap.from('.card', {
    scrollTrigger: {
      trigger: '.cards-container',
      start: 'top 80%',
      end: 'bottom 20%',
    },
    y: 60,
    opacity: 0,
    duration: 0.8,
    stagger: 0.15,
    ease: 'power3.out'
  });
}, []);
```

## Accessibility Rules (WCAG 2.1 AA Minimum)

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Tab order follows logical reading order
- Focus indicators visible (default or custom with `ring-2 ring-primary`)
- Escape key closes modals and popovers

```tsx
<button
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
  className="focus:ring-2 focus:ring-primary focus:outline-none"
>
  Submit
</button>
```

### ARIA Labels

```tsx
// Icon-only buttons must have aria-label
<button aria-label="Close modal">
  <X className="h-4 w-4" />
</button>

// Loading states must have aria-live
<div aria-live="polite" aria-busy={isLoading}>
  {isLoading ? 'Loading...' : content}
</div>

// Form errors must be associated
<input
  id="email"
  aria-invalid={!!error}
  aria-describedby={error ? 'email-error' : undefined}
/>
{error && <p id="email-error" role="alert">{error.message}</p>}
```

### Color Contrast

- Text: Minimum 4.5:1 contrast ratio (7:1 for AAA)
- Large text (≥18px or ≥14px bold): Minimum 3:1
- Interactive elements: 3:1 contrast with background
- Never rely on color alone to convey information

## Performance Rules

### Image Optimization

```tsx
import Image from 'next/image';

// Always use Next.js Image component
<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  priority // For above-the-fold images
  placeholder="blur" // For better UX
/>
```

### Lazy Loading

```tsx
// For below-the-fold content
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false, // If client-side only
});
```

### Infinite Scroll / Virtual Lists

```tsx
// Use react-window or @tanstack/react-virtual for long lists
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 80, // Estimated row height
});
```

## Component Composition Rules

### Keep Components Small

- One component = one responsibility
- Extract reusable logic into hooks
- Extract reusable UI into components
- Max 200 lines per component file (guideline, not strict rule)

### Prop Drilling vs Context

- **Props**: For 1-2 levels deep, explicit data flow
- **Context**: For app-wide state (auth, theme, project)
- **Zustand**: For complex client state (canvas, AI queue)

### Server vs Client Components (Next.js 16)

```tsx
// Server component (default in App Router)
// ✅ Fetch data, read files, access database
async function ProjectList() {
  const projects = await db.project.findMany();
  return <div>{projects.map(p => <ProjectCard key={p.id} project={p} />)}</div>;
}

// Client component (add 'use client')
// ✅ Hooks, event handlers, browser APIs, interactive state
'use client';
function InteractiveButton() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

## File Organization

```
components/
├── ui/                    # shadcn/ui primitives (button, input, dialog)
├── layout/                # AppShell, TopBar, Sidebar
├── dashboard/             # Dashboard-specific components
├── discovery/             # Discovery chat components
├── projects/              # Project management components
└── shared/                # Cross-cutting components (ErrorBoundary, EmptyState)
```

## Testing Rules

### Component Tests

- Test user interactions, not implementation details
- Use React Testing Library, not Enzyme
- Mock API calls with MSW (Mock Service Worker)
- Test accessibility with jest-axe

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('submits form on button click', async () => {
  const handleSubmit = jest.fn();
  render(<MyForm onSubmit={handleSubmit} />);

  await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
  await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

  await waitFor(() => {
    expect(handleSubmit).toHaveBeenCalledWith({ email: 'test@example.com' });
  });
});
```

## Summary

- **Layout**: Fixed header/sidebar, scrolling content only
- **Loading**: Always show loading states (buttons, skeletons, spinners)
- **Errors**: Inline for fields, toasts for actions, boundaries for crashes
- **Empty**: Clear messaging + CTA when no data
- **Forms**: Validate on blur, show errors inline
- **Modals**: Use sparingly, always dismissible
- **Responsive**: Mobile-first, touch-friendly sizes
- **Animation**: Purposeful, < 500ms, GSAP for complex
- **Accessibility**: Keyboard nav, ARIA labels, color contrast
- **Performance**: Lazy load, virtual lists, optimized images
- **Composition**: Small components, props vs context, server vs client
