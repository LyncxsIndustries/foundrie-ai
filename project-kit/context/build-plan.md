# Build Plan

## Contract Synchronization Gate

Any implementation change that corrects or changes a contract must be reflected in the same branch across the affected feature spec, dependent future specs, relevant context files, root AGENTS.md, and progress-tracker.md. Contracts include Prisma fields and relations, route signatures, auth helper signatures, AI task names and callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, and file ownership. A feature is not ready for review while later specs or context still describe stale fields, old API shapes, or invalid contracts.

## Purpose

This document defines the phase-by-phase implementation plan for Foundrie AI V15.0.0. It provides clear sequencing, done criteria, and dependencies for each build phase, enabling AI agents to implement features in the correct order with proper validation gates.

## UI-First Implementation Approach

Foundrie follows a UI-first build methodology:

1. **Design tokens first** — Colors, typography, spacing, shadows defined in `ui-tokens.md`
2. **Component library** — Build shadcn/ui components with proper typing and accessibility
3. **Layout scaffolding** — Fixed headers, sidebars, scrolling regions per `ui-rules.md`
4. **Wire up data** — Connect components to API routes and database
5. **Add interactions** — GSAP animations, micro-interactions, state transitions
6. **Polish** — Loading states, error boundaries, empty states, responsive behavior

This sequence prevents "backend-first tunnel vision" where functional APIs lack polished UIs.

## V15.0.0 Implementation Phases

### Phase 1: Foundation & Design System (Features 53-54 Prerequisites)

**Objective:** Establish design tokens, premium UI components, and layout foundations before feature implementation.

**Done Criteria:**
- [ ] `lib/design-tokens.ts` created with Lynx Theme Pro color palette
- [ ] Tailwind config updated with custom theme colors, shadows, and animations
- [ ] Base layout components: `AppShell`, `SidebarNav`, `TopBar`, `ScrollContainer`
- [ ] Premium button variants with GSAP press animations
- [ ] Glass morphism utility classes (backdrop-blur, rgba backgrounds)
- [ ] Inter font loaded with proper weights (400, 500, 600, 700, 800, 900)
- [ ] GSAP 3.12+ installed and configured
- [ ] next-cloudinary installed and configured

**Key Files:**
- `lib/design-tokens.ts`
- `tailwind.config.ts`
- `components/layout/AppShell.tsx`
- `components/ui/button.tsx` (enhanced)
- `app/layout.tsx` (font loading)

**Dependencies:** None (foundational)

---

### Phase 2: Cloudinary Media Infrastructure (Feature 54, 55)

**Objective:** Set up media storage layer for discovery file uploads and research management.

**Done Criteria:**
- [ ] Cloudinary account configured with upload presets
- [ ] Environment variables set: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- [ ] `ResearchFile` Prisma model created with migrations run
- [ ] `lib/media/cloudinary.ts` helper functions (upload, transform, download)
- [ ] `app/api/projects/[projectId]/research/files/route.ts` POST endpoint (upload metadata)
- [ ] `app/api/projects/[projectId]/research/files/route.ts` GET endpoint (list files)
- [ ] File type validation (images ≤10MB, videos ≤100MB, docs ≤25MB)
- [ ] Signed upload tokens generated server-side

**Key Files:**
- `prisma/schema.prisma` (ResearchFile model)
- `lib/media/cloudinary.ts`
- `lib/media/validation.ts`
- `app/api/projects/[projectId]/research/files/route.ts`

**Dependencies:** Phase 1 (design tokens for UI components)

---

### Phase 3: Enhanced Discovery Chat UI (Feature 54)

**Objective:** Build premium chat interface with fixed scrolling layout and file upload support.

**Done Criteria:**
- [ ] `components/discovery/ChatContainer.tsx` with fixed header/sidebar, scrolling messages
- [ ] `components/discovery/MessageList.tsx` with auto-scroll to bottom on new messages
- [ ] `components/discovery/MessageInput.tsx` with textarea auto-resize
- [ ] `components/discovery/FileUploadZone.tsx` with drag-and-drop and CldUploadWidget
- [ ] `components/discovery/UploadedFileCard.tsx` showing thumbnails, filenames, delete action
- [ ] Glass morphism applied to message bubbles (user messages)
- [ ] AI message typing indicator with animated dots
- [ ] Smooth scroll behavior with `scrollIntoView({ behavior: 'smooth' })`
- [ ] File upload progress bar with percentage
- [ ] Error states for upload failures
- [ ] Empty state when no files uploaded yet

**Key Files:**
- `components/discovery/ChatContainer.tsx`
- `components/discovery/MessageList.tsx`
- `components/discovery/MessageInput.tsx`
- `components/discovery/FileUploadZone.tsx`
- `components/discovery/UploadedFileCard.tsx`
- `app/projects/[id]/discovery/page.tsx`

**Dependencies:** Phase 1, Phase 2

---

### Phase 4: Dynamic Phase Completion Detection (Feature 53)

**Objective:** Implement semantic phase analysis and intelligent transition logic.

**Done Criteria:**
- [ ] `lib/ai/phase-detector.ts` with semantic analysis function
- [ ] Phase completion scoring algorithm (0-100 confidence)
- [ ] Auto-advance trigger when confidence ≥ 85%
- [ ] Explicit continuation prompt when confidence 60-84%
- [ ] Hold/clarification request when confidence < 60%
- [ ] Project complexity classifier (SIMPLE/STANDARD/COMPLEX)
- [ ] Phase requirements checklist per complexity level
- [ ] `ProjectPhase` enum updated with dynamic phase transitions
- [ ] AI system prompt updated with phase detection rules
- [ ] Phase transition logging with confidence scores

**Key Files:**
- `lib/ai/phase-detector.ts`
- `lib/ai/prompts/phase-detection.ts`
- `lib/projects/phase-transitions.ts`
- `prisma/schema.prisma` (Project.phaseConfidence field)

**Dependencies:** Phase 3 (chat interface for displaying prompts)

---

### Phase 5: Research Phase Media Management (Feature 55)

**Objective:** Organize uploaded media into categories and enable AI analysis.

**Done Criteria:**
- [ ] Category tagging UI in FileUploadZone (inspiration, wireframes, branding, technical-docs, competitors, general)
- [ ] Filter/search uploaded files by category or tag
- [ ] AI analysis trigger: extract text from images (OCR), generate descriptions
- [ ] `ResearchFile.aiDescription` and `ResearchFile.extractedText` fields populated
- [ ] Gallery view with grid layout and lightbox modal
- [ ] Bulk operations: delete multiple files, change categories
- [ ] Export research files to ZIP (download from Cloudinary URLs and organize into folders)

**Key Files:**
- `components/research/MediaGallery.tsx`
- `components/research/CategoryFilter.tsx`
- `lib/media/ai-analysis.ts`
- `lib/media/export-to-zip.ts`
- `app/api/projects/[projectId]/research/analyze/route.ts`

**Dependencies:** Phase 2, Phase 3

---

### Phase 6: Premium Dashboard UI Redesign (Feature 56)

**Objective:** Redesign project dashboard with Lynx Theme Pro aesthetic and GSAP animations.

**Done Criteria:**
- [ ] `app/dashboard/page.tsx` rebuilt with glass cards
- [ ] Project cards with hover lift animation (GSAP)
- [ ] Magnetic button effects on "New Project" CTA
- [ ] Scroll-triggered stagger reveals for project list
- [ ] Status badges with glow effects (primary color #00e676)
- [ ] Quick actions menu with smooth dropdown animation
- [ ] Empty state illustration with fade-in animation
- [ ] Skeleton loaders during data fetch
- [ ] Responsive grid (1 col mobile, 2 col tablet, 3 col desktop)

**Key Files:**
- `app/dashboard/page.tsx`
- `components/dashboard/ProjectCard.tsx`
- `components/dashboard/NewProjectButton.tsx`
- `components/dashboard/EmptyState.tsx`
- `lib/animations/dashboard.ts`

**Dependencies:** Phase 1 (design tokens and GSAP setup)

---

### Phase 7: Dynamic Project Templates System (Feature 57)

**Objective:** Provide starter templates matched to project complexity.

**Done Criteria:**
- [ ] Template library with 9+ templates (3 SIMPLE, 3 STANDARD, 3 COMPLEX)
- [ ] Template selection UI in project creation flow
- [ ] Pre-filled discovery context based on template
- [ ] Template metadata: name, description, complexity, tech stack suggestion, sample phases
- [ ] "Start from scratch" option alongside templates
- [ ] Template preview cards with example diagram thumbnails
- [ ] Templates stored in `lib/templates/definitions.ts`

**Key Files:**
- `lib/templates/definitions.ts`
- `lib/templates/apply-template.ts`
- `components/projects/TemplateSelector.tsx`
- `components/projects/TemplatePreviewCard.tsx`
- `app/projects/new/page.tsx`

**Dependencies:** Phase 4 (complexity classifier logic)

---

### Phase 8: Enhanced Project Overview (Feature 58)

**Objective:** Friendly project overview page with progress visualization.

**Done Criteria:**
- [ ] `app/projects/[id]/page.tsx` with hero section, phase progress, key metrics
- [ ] Phase progress component with animated progress bars
- [ ] Visual phase timeline (past phases grayed, current highlighted, future dimmed)
- [ ] Key metrics cards: messages exchanged, files uploaded, diagrams generated, specs created
- [ ] Quick action buttons: Resume Discovery, View Diagrams, Download ZIP
- [ ] Recent activity feed (last 5 actions)
- [ ] Glass morphism cards with subtle shadows
- [ ] Responsive layout (stacks on mobile)

**Key Files:**
- `app/projects/[id]/page.tsx`
- `components/projects/PhaseProgressBar.tsx`
- `components/projects/PhaseTimeline.tsx`
- `components/projects/MetricsCard.tsx`
- `components/projects/ActivityFeed.tsx`

**Dependencies:** Phase 4 (phase completion data)

---

### Phase 9: Resume/Review/Discard Session Workflow (Feature 59)

**Objective:** Enable users to pause, resume, or restart discovery sessions.

**Done Criteria:**
- [ ] Session state management: `ACTIVE`, `PAUSED`, `COMPLETED`, `DISCARDED`
- [ ] "Pause Session" button in discovery chat
- [ ] Resume session page showing last message and context
- [ ] Review session summary before resuming (phases completed, key decisions, uploaded files)
- [ ] Discard session with confirmation modal (permanent action)
- [ ] Branch/fork session option (create new session from this point)
- [ ] Session history sidebar (view past sessions for same project)
- [ ] Auto-save session state every 30 seconds

**Key Files:**
- `lib/sessions/state-machine.ts`
- `components/discovery/SessionControls.tsx`
- `components/projects/ResumeSessionModal.tsx`
- `app/projects/[id]/sessions/[sessionId]/page.tsx`
- `prisma/schema.prisma` (Session model updates)

**Dependencies:** Phase 3 (chat infrastructure)

---

### Phase 10: Context File Generation Updates (Features 60-62)

**Objective:** Split ui-context.md into 3 specialized files and create missing context files.

**Done Criteria:**
- [ ] `ui-tokens.md` template with Lynx Theme Pro tokens
- [ ] `ui-rules.md` template with layout and behavior patterns
- [ ] `ui-registry.md` template with component catalog
- [ ] `build-plan.md` template (this file) with phase-by-phase plan
- [ ] `library-docs.md` template with third-party integration patterns
- [ ] ZIP generation updated to include 9+ context files
- [ ] Context generation job creates all files with project-specific content
- [ ] Validation: all context files reference correct project data

**Key Files:**
- `lib/generation/templates/ui-tokens.md.hbs`
- `lib/generation/templates/ui-rules.md.hbs`
- `lib/generation/templates/ui-registry.md.hbs`
- `lib/generation/templates/build-plan.md.hbs`
- `lib/generation/templates/library-docs.md.hbs`
- `lib/generation/context-generator.ts`

**Dependencies:** Phase 1-9 (need full feature set to generate accurate templates)

---

### Phase 11: Master Prompt Generation (Feature 63)

**Objective:** Generate comprehensive "one-command build" prompts for frontend projects.

**Done Criteria:**
- [ ] Master prompt template covering: objective, tech stack, design tokens, components, animations, pages, assets, implementation order
- [ ] Project type detection (frontend-heavy vs backend-heavy)
- [ ] Master prompt only generated for SIMPLE and STANDARD frontend projects
- [ ] Included in ZIP at `/prompts/master-prompt.md`
- [ ] References all design tokens, component specs, and animation patterns
- [ ] Uses Cloudinary URLs for assets (no placeholder images)
- [ ] Includes step-by-step implementation sequence

**Key Files:**
- `lib/generation/templates/master-prompt.md.hbs`
- `lib/generation/master-prompt-generator.ts`
- `lib/zip/include-master-prompt.ts`

**Dependencies:** Phase 10 (context files needed for prompt)

---

### Phase 12: Enhanced ZIP Export with Media (Feature 64)

**Objective:** Download Cloudinary media and include in ZIP export.

**Done Criteria:**
- [ ] ZIP generation job queries `ResearchFile` table
- [ ] Download each file from Cloudinary URL
- [ ] Organize into `/research/{category}/` folders
- [ ] Generate `/research/FILES.md` manifest with metadata
- [ ] Handle download failures gracefully (log error, continue with other files)
- [ ] ZIP export includes all 9+ context files
- [ ] ZIP export includes master prompt (if applicable)
- [ ] Export time logged and displayed to user

**Key Files:**
- `lib/zip/download-cloudinary-media.ts`
- `lib/zip/generate-files-manifest.ts`
- `trigger/zip-generation-job.ts` (updated)

**Dependencies:** Phase 2 (ResearchFile model), Phase 5 (media management), Phase 10 (context files), Phase 11 (master prompt)

---

### Phase 13: AI Workflow Rules Update (Feature 53 Integration)

**Objective:** Document semantic phase detection rules for AI agents.

**Done Criteria:**
- [ ] `ai-workflow-rules.md` updated with phase detection algorithm
- [ ] Decision matrix for auto-advance vs explicit prompt
- [ ] Examples of high-confidence vs low-confidence phase completions
- [ ] Rules for handling ambiguous user responses
- [ ] Instructions for logging phase transitions
- [ ] Guidelines for adapting conversation tone per complexity level (SIMPLE = casual, COMPLEX = formal)

**Key Files:**
- `project-kit/context/ai-workflow-rules.md`

**Dependencies:** Phase 4 (phase detection implementation)

---

### Phase 14: Integration Testing & Validation

**Objective:** End-to-end testing of all V15.0.0 features.

**Test Cases:**
1. **Dynamic Phase Flow**
   - [ ] Create SIMPLE project, verify 3-4 phases only
   - [ ] Create STANDARD project, verify 6-7 phases
   - [ ] Create COMPLEX project, verify 8+ phases
   - [ ] Verify auto-advance on clear completion
   - [ ] Verify explicit prompt on ambiguous completion

2. **Media Upload & Management**
   - [ ] Upload image, verify Cloudinary storage
   - [ ] Upload video, verify transcoding
   - [ ] Upload PDF, verify metadata storage
   - [ ] Tag file with category, verify filtering works
   - [ ] Delete file, verify Cloudinary cleanup
   - [ ] Export ZIP, verify media included in `/research` folder

3. **Premium UI**
   - [ ] Dashboard animations play on page load
   - [ ] Magnetic button follows cursor
   - [ ] Chat auto-scrolls to new messages
   - [ ] Glass morphism renders correctly on all browsers
   - [ ] Responsive layout works on mobile, tablet, desktop

4. **Session Management**
   - [ ] Pause session, verify state saved
   - [ ] Resume session, verify context restored
   - [ ] Discard session, verify confirmation modal
   - [ ] Branch session, verify new session created

5. **ZIP Export**
   - [ ] Export ZIP with media files
   - [ ] Verify all 9+ context files included
   - [ ] Verify master prompt included (if applicable)
   - [ ] Verify `/research/FILES.md` manifest generated

**Key Files:**
- `tests/e2e/dynamic-phases.spec.ts`
- `tests/e2e/media-upload.spec.ts`
- `tests/e2e/premium-ui.spec.ts`
- `tests/e2e/session-management.spec.ts`
- `tests/e2e/zip-export.spec.ts`

**Dependencies:** Phase 1-12 (all features implemented)

---

### Phase 15: Documentation & Deployment

**Objective:** Update all documentation and deploy V15.0.0 to production.

**Done Criteria:**
- [ ] `progress-tracker.md` updated with V15.0.0 completion
- [ ] `CHANGELOG.md` generated with all features listed
- [ ] Migration guide from V14 to V15 (breaking changes documented)
- [ ] Cloudinary setup instructions in README
- [ ] Environment variable checklist updated
- [ ] Production deployment checklist completed
- [ ] Database migrations run on production
- [ ] Cloudinary upload presets configured in production
- [ ] Post-deployment smoke tests passed

**Key Files:**
- `project-kit/context/progress-tracker.md`
- `CHANGELOG.md`
- `docs/migration-v14-to-v15.md`
- `docs/cloudinary-setup.md`
- `README.md`

**Dependencies:** Phase 14 (testing complete)

---

## Implementation Priority Rules

1. **UI-first:** Build components before wiring data
2. **Test early:** Write component tests alongside implementation
3. **Incremental:** Each phase should be deployable independently
4. **Validation gates:** Don't proceed to next phase until done criteria met
5. **Documentation inline:** Update context files as features complete

## Phase Dependency Graph

```
Phase 1 (Foundation)
├── Phase 2 (Cloudinary)
│   ├── Phase 3 (Chat UI)
│   │   ├── Phase 4 (Phase Detection)
│   │   └── Phase 9 (Session Workflow)
│   └── Phase 5 (Research Media)
├── Phase 6 (Dashboard)
└── Phase 7 (Templates)
    └── Phase 8 (Project Overview)

Phase 10 (Context Files) — depends on Phases 1-9
Phase 11 (Master Prompt) — depends on Phase 10
Phase 12 (ZIP Export) — depends on Phases 2, 5, 10, 11
Phase 13 (AI Rules) — depends on Phase 4
Phase 14 (Testing) — depends on Phases 1-13
Phase 15 (Deployment) — depends on Phase 14
```

## Rollback Plan

If a phase fails validation:
1. Revert database migrations for that phase
2. Remove new routes/components from codebase
3. Update `progress-tracker.md` with blockers
4. Document failures and root cause
5. Re-plan approach before retrying

## Success Metrics

- [ ] All 15 phases completed with done criteria met
- [ ] Zero P0 bugs in production after 1 week
- [ ] <2s page load time for dashboard
- [ ] <500ms Cloudinary upload latency
- [ ] 100% test coverage for critical paths (phase detection, media upload, ZIP export)
