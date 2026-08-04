# Feature 63 - Discovery Chat UI Fixes

## Type

ENHANCEMENT

## What This Delivers

Fixes critical visual bugs in the Discovery Chat UI based on user feedback. The chat input stays anchored to the bottom of the viewport, only the message area scrolls with automatic scrolling to the latest message, and chat bubbles properly enclose text and images independently. After this feature, the Discovery Chat interface provides a polished, professional chat experience with proper scrolling behavior and message presentation.

## Dependencies

- Feature 10 (Discovery Chat) - the base chat implementation
- Feature 54 (Enhanced Discovery Chat UI) - the current UI implementation
- Foundrie AI Skills - UI refinement patterns

## Context To Read First

- `context/project-overview.md`
- `context/ui-tokens.md`
- `context/ui-rules.md`
- `context/ui-registry.md`
- `context/code-standards.md`
- `project-kit/skills/foundrie-ai-skill/SKILL.md`
- `project-kit/examples/` - premium chat UI patterns

## Context7 Docs To Check

```bash
npx ctx7 library tailwindcss "sticky positioning and scroll containers"
npx ctx7 library react "auto-scroll to bottom on content update"
```

## Files Owned

None - this feature modifies existing Discovery Chat files but does not own them exclusively.

## Files

MODIFY: `components/chat/ChatMessage.tsx` - separate text and image rendering into distinct bubbles
CREATE: `components/chat/ChatMessage.test.tsx` - add tests for separate bubble rendering

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract, update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch.

### Sticky Chat Input Implementation

```tsx
// Fixed scroll container pattern
<div className="flex flex-col h-screen">
  {/* Header - fixed */}
  <header className="flex-none">
    {/* Header content */}
  </header>
  
  {/* Messages - scrollable only */}
  <div className="flex-1 overflow-y-auto" ref={messagesContainerRef}>
    {messages.map((msg) => (
      <ChatMessage key={msg.id} message={msg} />
    ))}
  </div>
  
  {/* Input - sticky to bottom */}
  <div className="flex-none sticky bottom-0 bg-background border-t">
    <ChatInput />
  </div>
</div>
```

### Auto-Scroll Logic

```tsx
// Auto-scroll to latest message
useEffect(() => {
  if (messagesContainerRef.current) {
    messagesContainerRef.current.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }
}, [messages.length]);
```

### Separate Text and Image Bubbles

```tsx
// Current (wrong): text and image in same bubble
<div className="message-bubble">
  <p>{message.text}</p>
  {message.image && <img src={message.image} />}
</div>

// Fixed: separate bubbles
{message.text && (
  <div className="message-bubble text-bubble">
    <p>{message.text}</p>
  </div>
)}
{message.image && (
  <div className="message-bubble image-bubble">
    <img src={message.image} />
  </div>
)}
```

### Reference Implementation

- Check `project-kit/examples/floria-full.webp` for premium chat UI patterns
- Check `inspo/` screenshots for modern chat interfaces
- Use `project-kit/skills/foundrie-ai-skill/SKILL.md` for spacing and animation guidelines

## Out of Scope

- State management for chat messages (handled in Feature 64)
- Chat completion logic (handled in Feature 64)
- Requirements page integration (handled in Feature 65)
- Advanced animations beyond smooth scrolling

## Future Modifications

- Feature 74 (Refine Modals & Dialogs) - may add glassmorphism effects to chat modal
- Future features may add message reactions or rich media embeds

## Quality Gates

- Run `npm run sync:check` and ensure it passes
- Run `npm run security:all` and ensure it passes
- Run `npm run test` and ensure it passes
- Run `npm run build` and ensure it passes

## Acceptance Criteria

- [ ] Chat input is sticky/anchored to the bottom of the viewport and never scrolls
- [ ] Header remains fixed at the top
- [ ] Only the messages container is scrollable
- [ ] Auto-scroll to bottom occurs smoothly when new messages arrive
- [ ] Text messages render in their own bubble
- [ ] Images render in separate bubbles from text
- [ ] Multiple images in sequence each get their own bubble
- [ ] Separate bubble rendering is tested in `components/chat/ChatMessage.test.tsx`
- [ ] Layout works on mobile, tablet, and desktop viewports
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at Feature 64
- [ ] All quality gates pass
- [ ] CodeRabbit review completed and all findings resolved (recommended quality gate)

## Setup Instructions

No new external accounts or API keys required. This feature uses existing Discovery Chat implementation with UI fixes only.

For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
