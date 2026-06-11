# Foundrie AI Contract Checklist

## Purpose
This document tracks all established contracts in Foundrie AI that future feature specs and generated projects must respect per **Hard Rule 0: Contract Synchronization Gate**.

## Active Contracts (as of Feature 33)

### Database Schema Contracts (Prisma)
- **Prisma version**: 7.8.0 (exact-pinned)
- **Generator**: `prisma-client` (not `prisma-client-js`) with required `output` path
- **Driver adapter**: `@prisma/adapter-neon` with `PrismaNeon` over pooled `DATABASE_URL`
- **Config location**: `prisma.config.ts` (Prisma 7 standard, not in `schema.prisma`)
- **Connection URLs**:
  - `DATABASE_URL`: Pooled connection (Neon serverless driver over WebSocket 443)
  - `DIRECT_URL`: Direct TCP connection for migrations (with `connect_timeout`)
- **Scripts**: `db:generate`, `db:push`, `db:migrate`, `db:studio`, `postinstall` (prisma generate)

### Liveblocks Contracts
- **Packages**: `@liveblocks/client@2.20.2`, `@liveblocks/react@2.20.2`, `@liveblocks/node@2.20.2`, `@liveblocks/react-flow@3.19.5`
- **Storage interface**: `{ diagramType?: DiagramType }`
- **Presence interface**: `UserPresence extends JsonObject { cursor: {x,y}|null, selectedNodeId: string|null, aiStatus: "idle"|"thinking"|"generating" }`
- **Room ID pattern**: `project:{projectId}`
- **Auth route**: `/api/liveblocks-auth` (project-scoped via `requireProjectMember`)
- **Initial presence**: `DEFAULT_PRESENCE` from `lib/liveblocks/presence.ts`
- **Performance pattern**: Use `useOthersConnectionIds` + `useOther` (not `useOthers` directly)

### Authentication & Authorization Contracts
- **Auth provider**: Clerk (`@clerk/nextjs@7.4.3`)
- **Middleware**: `proxy.ts` (Next.js 16, not `middleware.ts`)
- **Webhook secret**: `CLERK_WEBHOOK_SIGNING_SECRET` (not `CLERK_WEBHOOK_SECRET`)
- **Auth helpers**:
  - `getAuthUser()`: Maps Clerk `userId` → local `User` via `clerkId`, selects only `id/clerkId/email/plan/role`
  - `requireAuth()`: Throws `AuthError` → 401
  - `requireProjectOwner()`: Owner-only operations
  - `requireProjectMember()`: Owner + Collaborator operations
  - `isAdmin()`: Checks `ADMIN_EMAILS` env var
- **Ownership failures**: Return 404 (not 403)
- **User ownership scope**: All user-owned queries must scope by authenticated `user.id`, never trust request input

### AI Rotation Engine Contracts
- **Config file**: `config/model.yaml` (pinned exact model IDs, Zod-validated, rejects `"latest"`)
- **Routing strategy**: Unified rotation (all tasks use single tier-primary chain)
- **Tier primary**:
  - FREE: `deepseek-r1` (position 3 in chain)
  - PRO/ENTERPRISE: `claude-sonnet-4` (position 1 in chain)
- **Fallback chain**: Claude Sonnet 4 → Gemini Pro → DeepSeek R1 → Nvidia Llama 405B → Groq Llama 70B → OpenRouter Qwen Coder
- **AI call signature**: `callAI(task, { systemPrompt, userPrompt, plan, maxTokens })` (not messages array)
- **AI stream signature**: `callAIStream(task, { systemPrompt, userPrompt, plan, maxTokens })`
- **Response shape**: `{ status: "success"|"queued", text: string, retryable?: boolean }` (discriminated union)
- **Task names**: See `lib/ai/model-routing.ts` `AITask` union (30+ tasks, all route to `unified-rotation`)
- **Provider adapters**: OpenRouter, DeepSeek, Groq, Gemini, Anthropic, Nvidia NIM

### Diagram Contracts
- **Types**: 12 types (system-context, container, component, erd, sequence, dfd, state-machine, deployment, api-map, feature-dag, agent-architecture, security-architecture)
- **Categories**: 5 (structural, behavioral, architectural, data, infrastructure)
- **Storage**: `reactFlowData` JSON field (large, excluded from list views)
- **PNG storage**: Vercel Blob with versioned paths `diagrams/{diagramId}/v{version}.png`
- **Status flow**: `QUEUED` → `GENERATING` → `RENDERING` → `CAPTURING` → `DONE`/`ERROR`
- **Generation**: Sequential, status-driven, recoverable (one failure doesn't cancel batch)
- **System Context**: Always first, requires human approval before continuing batch

### Storage Contracts
- **Database**: Neon PostgreSQL (relational metadata)
- **Blob storage**: Vercel Blob (ZIPs, diagram PNGs, canvas snapshots, large generated documents)
- **Training data**: MongoDB Atlas (isolated from Neon, anonymized only)

### ZIP Export Contracts
- **Filename pattern**: `{project-slug}_{YYYY-MM-DD_HH-mm-ss}.zip`
- **Root files**: `AGENTS.md`, `ARTKINS_STYLE_GUIDE.md`, `.env.example`, `.npmrc`
- **Required folders**: `context/`, `feature-specs/`, `diagrams/`, `requirements/`, `research/`
- **Conditional folders**: `.agents/skills/` (only when skills exist), `tools/`, `evals/`, research subfolders
- **Cache duration**: 10 minutes (stored in `Project.lastZipGeneratedAt`)

### Trigger.dev Contracts
- **Version**: SDK v4 (`@trigger.dev/sdk`)
- **Config file**: `trigger.config.ts` (project ref, retries, maxDuration)
- **Task pattern**: `task({ id, retry, run })` (not `client.defineJob`)
- **Trigger from backend**: `tasks.trigger(taskId, payload)` → returns `handle` with `runId`
- **Trigger and wait**: `tasks.triggerAndWait()` → returns `Result` object (check `result.ok` before accessing `result.output`)

### Next.js & React Contracts
- **Next.js version**: 16.2.7 (patched for CVE)
- **Middleware**: `proxy.ts` (not `middleware.ts`)
- **App structure**: Root-level `app/` (not `src/app`)
- **Async params**: Next.js 16 `params` are Promise (await before access)

### Styling Contracts
- **Tailwind version**: v4 (CSS-first, no `tailwind.config.ts`)
- **Token location**: `app/globals.css` via `@theme` directive
- **Design tokens**: `lib/design-system.ts` (typography, spacing, radius, motion)
- **Touch targets**: Minimum 44×44px (`min-touch` utility in globals.css)

### Testing Contracts
- **Test runner**: Vitest + React Testing Library + jsdom
- **Scripts**: `test` (non-watch single run), `test:watch`, `test:coverage`
- **Gate**: Feature is not done until `npm run test` and `npm run build` both pass

### Logging Contracts
- **Format**: Structured JSON only (no `console.log`)
- **Request ID**: Every request carries UUID, logs correlate by `trace_id`
- **PII**: Scrubbed before emission

### Plan Limits Contracts
- **FREE**: 3 projects max
- **PRO/ENTERPRISE**: Unlimited projects

## Contract Synchronization Workflow

When ANY implementation changes or corrects a contract:

1. **Identify affected contracts** from the list above
2. **Update the current feature spec** with the correction
3. **Update ALL later specs** (34-52) that reference the old contract
4. **Update context files**: `architecture-context.md`, `code-standards.md`, etc.
5. **Update AGENTS.md** if the contract affects agent behavior
6. **Update progress-tracker.md** to document the change
7. **Update this checklist** to reflect the new contract

## Hard Gate Reminder

Per **Hard Rule 0**, contract synchronization happens **before tests/build/review** on the same feature branch. Do not merge a branch with outdated contracts in future specs.
