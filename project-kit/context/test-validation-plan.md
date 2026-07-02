# V15.0.0 Test Validation Plan

## Purpose

This document defines the end-to-end testing strategy for Foundrie AI V15.0.0 features. All tests must pass before V15.0.0 is considered production-ready.

## Test Categories

1. **Unit Tests** — Individual functions and components
2. **Integration Tests** — API routes, database operations, service interactions
3. **E2E Tests** — Full user workflows across multiple features
4. **Performance Tests** — Load times, animation frame rates, media upload speeds
5. **Accessibility Tests** — WCAG 2.1 AA compliance
6. **Cross-Browser Tests** — Chrome, Firefox, Safari, Edge

## Test Environments

- **Local**: Development machine with test database
- **Staging**: Neon staging database, Cloudinary test account, Vercel preview deployment
- **Production**: Final smoke tests post-deployment (read-only validation, no destructive operations)

---

## Feature 53: Dynamic Phase Completion Detection

### Unit Tests

**`lib/ai/phase-detector.ts`:**
- [ ] `classifyProject()` correctly identifies SIMPLE projects (keywords: landing page, portfolio, static)
- [ ] `classifyProject()` correctly identifies STANDARD projects (keywords: app, dashboard, CRUD, auth)
- [ ] `classifyProject()` correctly identifies COMPLEX projects (keywords: enterprise, multi-tenant, microservices, real-time)
- [ ] `analyzePhaseCompletion()` returns confidence 85-100 when all phase requirements met
- [ ] `analyzePhaseCompletion()` returns confidence 60-84 when requirements partially met
- [ ] `analyzePhaseCompletion()` returns confidence <60 when critical information missing
- [ ] `determineTransitionType()` returns `'auto'` for confidence ≥85%
- [ ] `determineTransitionType()` returns `'explicit'` for confidence 60-84%
- [ ] `determineTransitionType()` returns `'hold'` for confidence <60%

**`lib/projects/phase-transitions.ts`:**
- [ ] Phase transition logging captures all required fields (projectId, fromPhase, toPhase, confidence, transitionType, messageCount, timestamp, complexity)
- [ ] Phase transition history query returns transitions ordered by timestamp

### Integration Tests

**Phase detection with conversation history:**
- [ ] SIMPLE project auto-advances after 5-10 messages when requirements clear
- [ ] STANDARD project prompts for continuation after 15-20 messages with 70% confidence
- [ ] COMPLEX project holds at Phase 3 when scope constraints missing (<60% confidence)

**System prompt integration:**
- [ ] AI responses include phase confidence scores in metadata
- [ ] Auto-advance messages formatted correctly: "We've covered [phase]. Moving to [next]..."
- [ ] Explicit prompts offer 3 choices: continue, dive deeper, review

### E2E Tests

**Scenario: Simple landing page project**
1. User creates project with description "Build a dark theme portfolio site"
2. System classifies as SIMPLE
3. AI asks 5 questions (Problem, Users, Core Flow)
4. User provides clear answers
5. System auto-advances through phases with 90%+ confidence
6. After 8 messages, system reaches Architecture Diagramming
7. UI shows "Phase 3/4" progress indicator

**Scenario: Complex enterprise platform**
1. User creates project "Multi-tenant SaaS with real-time collaboration"
2. System classifies as COMPLEX
3. AI asks 30+ questions across 8 phases
4. User provides vague answer to Scope & Constraints
5. System holds with "I need more details about..." message
6. User clarifies constraints
7. Confidence increases to 75%, system prompts "Would you like to: 1. Continue..."
8. User selects "Continue"
9. System advances to next phase

---

## Feature 54: Enhanced Discovery Chat UI with File Upload

### Unit Tests

**`components/discovery/FileUploadZone.tsx`:**
- [ ] Validates file types (images, videos, documents) before upload
- [ ] Rejects files exceeding size limits (images ≤10MB, videos ≤100MB, docs ≤25MB)
- [ ] Shows upload progress percentage
- [ ] Displays error message on upload failure
- [ ] Calls `onUploadSuccess` callback with file metadata

**`components/discovery/MessageList.tsx`:**
- [ ] Auto-scrolls to bottom when new message arrives
- [ ] Renders user messages with glass morphism background
- [ ] Renders AI messages with markdown support
- [ ] Shows typing indicator when `isLoading=true`

**`components/discovery/ChatContainer.tsx`:**
- [ ] Chat header fixed at top (no scroll)
- [ ] Message list scrolls independently
- [ ] Input fixed at bottom (no scroll)
- [ ] Only message list region has `overflow-y-auto`

### Integration Tests

**File upload with Cloudinary:**
- [ ] Upload image, verify Cloudinary storage with signed URL
- [ ] Upload video, verify transcoding completion
- [ ] Upload PDF, verify metadata saved to `researchFiles` table
- [ ] Upload invalid file type (e.g., .exe), verify rejection
- [ ] Upload oversized file (>100MB video), verify rejection

**Auto-scroll behavior:**
- [ ] New AI message triggers smooth scroll to bottom
- [ ] User manually scrolls up, new message arrives, scroll remains at user position (no forced scroll)
- [ ] User at bottom, new message arrives, scroll stays at bottom

### E2E Tests

**Scenario: Discovery with media uploads**
1. User opens discovery chat
2. User types "Build a portfolio site" and sends
3. AI responds with first question
4. Chat auto-scrolls to show AI message
5. User drags screenshot into upload zone
6. Upload progress bar shows 0% → 100%
7. File card appears below input with thumbnail
8. User sends "Use this design style"
9. AI references uploaded image in response
10. User scrolls up to review earlier messages
11. New AI message arrives, scroll position stays (no forced jump)

### Performance Tests

- [ ] Chat messages render within 100ms
- [ ] Auto-scroll animation completes in <300ms
- [ ] Upload progress updates every 100ms
- [ ] No layout shift (CLS < 0.1) when messages load

---

## Feature 55: Research Phase Media Management

### Unit Tests

**`components/research/MediaGallery.tsx`:**
- [ ] Filters files by category (inspiration, wireframes, branding, etc.)
- [ ] Search filters files by filename and tags
- [ ] Grid layout responsive (1 col mobile, 3 col tablet, 4 col desktop)
- [ ] Lightbox opens on file click with full preview

**`lib/media/ai-analysis.ts`:**
- [ ] Extracts text from images via OCR
- [ ] Generates descriptions for uploaded images
- [ ] Saves analysis to `ResearchFile.aiDescription` and `ResearchFile.extractedText`

### Integration Tests

**Category tagging:**
- [ ] User uploads file, selects "Wireframes" category
- [ ] File saved with `category: "wireframes"` in database
- [ ] Gallery filters show only "Wireframes" files when filter applied
- [ ] User changes category to "Branding", database updates atomically

**Bulk operations:**
- [ ] User selects 5 files, clicks "Delete Selected"
- [ ] All 5 files deleted from Cloudinary and database
- [ ] User selects 3 files, changes category to "Inspiration"
- [ ] All 3 files updated in single transaction

### E2E Tests

**Scenario: Organize research files**
1. User uploads 10 files (mixed images, PDFs, videos)
2. System saves all to Cloudinary with project folder
3. User tags 3 as "Inspiration", 4 as "Wireframes", 3 as "Branding"
4. User filters by "Wireframes", gallery shows only 4 files
5. User clicks file thumbnail, lightbox opens with full preview
6. User triggers AI analysis on all files
7. AI generates descriptions and extracts text
8. User exports ZIP, verifies files in `/research/wireframes/`, `/research/inspiration/`, `/research/branding/`

---

## Feature 56: Premium Dashboard UI Redesign

### Unit Tests

**`components/dashboard/ProjectCard.tsx`:**
- [ ] Renders glass morphism background with correct opacity
- [ ] Status badge shows correct color (green=complete, blue=in-progress, gray=draft)
- [ ] Hover triggers GSAP lift animation (y: -4px, duration: 0.2s)
- [ ] Mouse leave resets position (y: 0)
- [ ] Quick actions menu opens on click

**`components/dashboard/NewProjectButton.tsx`:**
- [ ] Magnetic effect follows cursor within bounds (x: cursor * 0.3, y: cursor * 0.3)
- [ ] Mouse leave triggers elastic reset (ease: 'elastic.out(1, 0.5)')
- [ ] Click triggers scale animation (0.95 → 1 with back.out easing)

### Integration Tests

**Scroll-triggered animations:**
- [ ] Project cards fade in with stagger (0.15s delay between each)
- [ ] Scroll to trigger point (80% viewport), animations play
- [ ] Scroll back up, animations reverse smoothly

### E2E Tests

**Scenario: Dashboard with animations**
1. User logs in, navigates to dashboard
2. Page loads, project cards stagger-reveal from bottom
3. User hovers over card, card lifts 4px with shadow increase
4. User moves cursor over "New Project" button
5. Button follows cursor with magnetic effect
6. User clicks button, scale animation plays
7. Navigation to project creation form

### Performance Tests

- [ ] Dashboard loads within 2s (LCP < 2.5s)
- [ ] Animations run at 60fps (no frame drops)
- [ ] Magnetic button responds within 50ms of cursor move
- [ ] No layout shift on animation trigger (CLS < 0.1)

---

## Feature 57: Dynamic Project Templates System

### Unit Tests

**`lib/templates/definitions.ts`:**
- [ ] Templates library contains 9+ templates
- [ ] Each template has name, description, complexity, tech stack, sample phases
- [ ] 3 templates classified as SIMPLE
- [ ] 3 templates classified as STANDARD
- [ ] 3 templates classified as COMPLEX

**`lib/templates/apply-template.ts`:**
- [ ] Applying template pre-fills project description
- [ ] Template context copied to conversation history
- [ ] Project complexity set based on template

### Integration Tests

**Template selection:**
- [ ] User selects "Portfolio Site" template (SIMPLE)
- [ ] Project created with SIMPLE complexity
- [ ] First discovery message references template context
- [ ] AI adapts phase flow to 3-4 phases

### E2E Tests

**Scenario: Create project from template**
1. User clicks "New Project"
2. Template selector shows 9 templates grouped by complexity
3. User hovers over "SaaS Dashboard" template (STANDARD)
4. Preview card shows tech stack, phases, example diagram thumbnail
5. User clicks "Use Template"
6. Project created with pre-filled description
7. Discovery chat starts with "I see you're building a SaaS dashboard..."
8. AI follows STANDARD phase flow (6-7 phases)

---

## Feature 58: Enhanced Project Overview

### Unit Tests

**`components/projects/PhaseProgressBar.tsx`:**
- [ ] Progress bar width animates based on `currentPhase / totalPhases`
- [ ] Confidence score displayed when provided (e.g., "85% confidence")
- [ ] Phase labels show "Phase 3/8" format

**`components/projects/MetricsCard.tsx`:**
- [ ] Displays label, value, and icon
- [ ] Optional trend indicator (up/down arrow)
- [ ] Glass morphism background with subtle shadow

### Integration Tests

**Activity feed:**
- [ ] Shows last 5 actions (message sent, file uploaded, diagram generated, etc.)
- [ ] Actions ordered by timestamp desc
- [ ] Real-time updates when new action occurs (via polling or webhook)

### E2E Tests

**Scenario: Project overview page**
1. User opens project
2. Overview page shows hero section with project name, description
3. Phase progress bar shows "Phase 4/8" with 50% fill
4. Metrics cards show: 24 messages, 5 files uploaded, 8 diagrams, 12 specs
5. Recent activity feed shows last 5 actions with timestamps
6. Quick action buttons: "Resume Discovery", "View Diagrams", "Download ZIP"
7. User clicks "View Diagrams", navigates to diagram workspace

---

## Feature 59: Resume/Review/Discard Session Workflow

### Unit Tests

**`lib/sessions/state-machine.ts`:**
- [ ] Session state transitions: `ACTIVE` → `PAUSED`, `PAUSED` → `ACTIVE`, `ACTIVE` → `DISCARDED`
- [ ] Invalid transitions throw error (e.g., `DISCARDED` → `ACTIVE`)
- [ ] Auto-save triggers every 30 seconds when session active

**`components/discovery/SessionControls.tsx`:**
- [ ] "Pause Session" button visible when session active
- [ ] "Resume Session" button visible when session paused
- [ ] "Discard Session" shows confirmation modal

### Integration Tests

**Session persistence:**
- [ ] User sends 5 messages, pauses session
- [ ] Session state saved with last message, phase, confidence score
- [ ] User closes browser, reopens project
- [ ] Resume modal shows: "You have an unfinished session. Last message: [preview]. Phase: [name]. Continue?"
- [ ] User clicks "Resume", chat resumes from last message

**Discard session:**
- [ ] User clicks "Discard Session"
- [ ] Confirmation modal: "This action cannot be undone. All progress will be lost."
- [ ] User confirms, session marked `DISCARDED`, messages remain in DB but hidden from UI
- [ ] New session created with fresh conversation

### E2E Tests

**Scenario: Pause and resume**
1. User in discovery chat, exchanges 10 messages
2. User clicks "Pause Session"
3. Session state changed to `PAUSED`, auto-save triggered
4. User navigates away, comes back later
5. Resume modal appears with context: "Last message: [...], Phase: Core Flows"
6. User clicks "Resume"
7. Chat loads previous messages
8. User sends new message, conversation continues seamlessly

---

## Cross-Feature Integration Tests

### End-to-End Full Project Flow

**Scenario: Simple project from start to ZIP export**
1. User signs up, verifies email
2. User creates project from "Portfolio Site" template (SIMPLE)
3. Discovery chat with AI, 8 messages exchanged
4. User uploads 3 design inspiration images
5. AI auto-advances through 4 phases (85%+ confidence each)
6. System generates requirements, architecture, 4 diagrams
7. User approves System Context diagram
8. System generates 6 context files, 8 feature specs
9. User downloads ZIP
10. ZIP contains: AGENTS.md, 6 context files, 8 specs, 4 diagrams (PNG + Mermaid), /research folder with 3 uploaded images

**Validation:**
- [ ] Total time: < 10 minutes
- [ ] ZIP size: 2-5 MB
- [ ] All files present and valid (no empty/corrupt files)
- [ ] Images in ZIP match uploaded images (byte-for-byte)

---

## Performance Benchmarks

### Page Load Times (LCP)

- [ ] Dashboard: < 2s
- [ ] Discovery Chat: < 1.5s
- [ ] Diagram Canvas: < 3s (includes Liveblocks connection)
- [ ] Project Overview: < 1.5s

### Interaction Response Times

- [ ] Button click to visual feedback: < 100ms
- [ ] Chat message send to AI response start: < 2s (first token)
- [ ] File upload (10MB image) to thumbnail display: < 5s
- [ ] Phase transition (auto-advance): < 500ms
- [ ] GSAP animations complete: < 500ms (per spec)

### Animation Frame Rates

- [ ] Dashboard scroll reveals: 60fps (no dropped frames)
- [ ] Chat auto-scroll: 60fps
- [ ] Magnetic button hover: 60fps
- [ ] Glass morphism rendering: 60fps

---

## Accessibility Tests (WCAG 2.1 AA)

### Keyboard Navigation

- [ ] All interactive elements accessible via Tab key
- [ ] Focus indicators visible (ring-2 ring-primary)
- [ ] Modal dialogs trap focus (Tab cycles within modal)
- [ ] Escape key closes modals and popovers
- [ ] Enter/Space activates buttons

### Screen Reader Support

- [ ] Icon-only buttons have `aria-label`
- [ ] Form errors have `aria-invalid` and `aria-describedby`
- [ ] Loading states have `aria-live="polite"` and `aria-busy`
- [ ] Status messages announced via `role="status"`
- [ ] Headings follow logical hierarchy (h1 → h2 → h3, no skips)

### Color Contrast

- [ ] Text on dark background: ≥4.5:1 ratio (text-primary #f5f5f5 on background #0f0f0f)
- [ ] Interactive elements: ≥3:1 contrast (primary #00e676 on background)
- [ ] Status colors (success/warning/error) distinguishable without relying on color alone (icons + labels)

### Touch Targets

- [ ] All interactive elements ≥44x44px (min-h-[44px] class)
- [ ] Primary action buttons ≥48x48px
- [ ] Mobile: increased padding on buttons (px-6)

---

## Cross-Browser Tests

### Desktop Browsers

**Chrome (latest):**
- [ ] All features functional
- [ ] Animations smooth at 60fps
- [ ] Glass morphism backdrop-blur renders correctly

**Firefox (latest):**
- [ ] All features functional
- [ ] Animations smooth
- [ ] Glass morphism with fallback if backdrop-filter unsupported

**Safari (latest):**
- [ ] All features functional
- [ ] Animations smooth
- [ ] Webkit-specific prefixes applied where needed

**Edge (latest):**
- [ ] All features functional
- [ ] Animations smooth
- [ ] Chromium-based, should match Chrome behavior

### Mobile Browsers

**iOS Safari (latest):**
- [ ] Touch interactions work (tap, swipe, pinch)
- [ ] Fixed scrolling layout works (no double-scroll bug)
- [ ] File upload from camera works

**Android Chrome (latest):**
- [ ] Touch interactions work
- [ ] Fixed scrolling layout works
- [ ] File upload works

---

## Security Tests

### File Upload Security

- [ ] Server validates file types (not just client-side)
- [ ] Signed Cloudinary uploads prevent unauthorized access
- [ ] File size limits enforced server-side
- [ ] Uploaded files scoped to project (no cross-project access)

### Authorization

- [ ] Phase detection routes require authentication
- [ ] Project owners can invite collaborators
- [ ] Collaborators cannot delete projects
- [ ] ZIP download requires project membership

### Input Validation

- [ ] Project names sanitized (no XSS)
- [ ] Phase confidence scores validated (0-100 range)
- [ ] File metadata validated before saving

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (unit, integration, E2E)
- [ ] No TypeScript errors (`tsc --noEmit`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Database migrations reviewed and tested on staging
- [ ] Environment variables configured on Vercel
- [ ] Cloudinary account set up with upload presets

### Post-Deployment (Production)

- [ ] Smoke test: Create project, send message, upload file
- [ ] Smoke test: Download ZIP, verify contents
- [ ] Monitor error rates (< 1% error rate)
- [ ] Monitor performance (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- [ ] Check Cloudinary usage (bandwidth, storage)
- [ ] Verify Liveblocks connections stable

---

## Test Automation

### CI/CD Pipeline

1. **On Pull Request:**
   - Run unit tests (`npm run test`)
   - Run linting (`npm run lint`)
   - Run build (`npm run build`)
   - Run Playwright E2E tests (subset: critical paths only)

2. **On Merge to Main:**
   - Run full test suite (unit + integration + E2E)
   - Deploy to staging
   - Run smoke tests on staging
   - If all pass, deploy to production
   - Run smoke tests on production

### Test Coverage Targets

- [ ] Unit test coverage: ≥80% for critical modules (phase-detector, media upload, session state)
- [ ] Integration test coverage: 100% for API routes
- [ ] E2E test coverage: All user-facing workflows (create project, discovery, upload, download)

---

## Success Criteria

V15.0.0 is ready for production when:

1. **All unit tests pass** (no failures, no skipped tests except documented blockers)
2. **All integration tests pass** (API routes, database operations, Cloudinary uploads)
3. **Critical E2E tests pass** (simple project flow, complex project flow, media upload, ZIP export)
4. **Performance benchmarks met** (LCP < 2.5s, animations 60fps, upload < 5s)
5. **Accessibility compliance** (WCAG 2.1 AA, keyboard nav, screen reader, color contrast, touch targets)
6. **Cross-browser compatibility** (Chrome, Firefox, Safari, Edge — desktop and mobile)
7. **Security validation** (file upload security, authorization, input validation)
8. **Post-deployment smoke tests pass** (production environment stable)

---

## Rollback Plan

If critical issues found in production:

1. **Immediate:** Revert deployment to previous stable version (V14.x.x)
2. **Document:** Log issue with severity, impact, reproduction steps
3. **Fix:** Address root cause in hotfix branch
4. **Test:** Re-run full test suite on hotfix
5. **Deploy:** Hotfix to production with accelerated review
6. **Monitor:** Watch error rates, performance metrics, user feedback

---

## Test Execution Log

**Date**: [To be filled during test execution]
**Tester**: [Name]
**Environment**: [Local / Staging / Production]

| Test Category | Tests Passed | Tests Failed | Notes |
|---|---|---|---|
| Feature 53 Unit Tests | 0/9 | 0 | Not yet run |
| Feature 53 Integration Tests | 0/3 | 0 | Not yet run |
| Feature 53 E2E Tests | 0/2 | 0 | Not yet run |
| Feature 54 Unit Tests | 0/8 | 0 | Not yet run |
| Feature 54 Integration Tests | 0/5 | 0 | Not yet run |
| Feature 54 E2E Tests | 0/1 | 0 | Not yet run |
| Feature 55 Unit Tests | 0/5 | 0 | Not yet run |
| Feature 55 Integration Tests | 0/4 | 0 | Not yet run |
| Feature 55 E2E Tests | 0/1 | 0 | Not yet run |
| Feature 56 Unit Tests | 0/5 | 0 | Not yet run |
| Feature 56 Integration Tests | 0/2 | 0 | Not yet run |
| Feature 56 E2E Tests | 0/1 | 0 | Not yet run |
| Feature 57 Unit Tests | 0/5 | 0 | Not yet run |
| Feature 57 Integration Tests | 0/2 | 0 | Not yet run |
| Feature 57 E2E Tests | 0/1 | 0 | Not yet run |
| Feature 58 Unit Tests | 0/4 | 0 | Not yet run |
| Feature 58 Integration Tests | 0/2 | 0 | Not yet run |
| Feature 58 E2E Tests | 0/1 | 0 | Not yet run |
| Feature 59 Unit Tests | 0/4 | 0 | Not yet run |
| Feature 59 Integration Tests | 0/3 | 0 | Not yet run |
| Feature 59 E2E Tests | 0/1 | 0 | Not yet run |
| Cross-Feature Integration | 0/1 | 0 | Not yet run |
| Performance Tests | 0/12 | 0 | Not yet run |
| Accessibility Tests | 0/12 | 0 | Not yet run |
| Cross-Browser Tests | 0/8 | 0 | Not yet run |
| Security Tests | 0/8 | 0 | Not yet run |

**Total**: 0/128 tests passed, 0 failed
