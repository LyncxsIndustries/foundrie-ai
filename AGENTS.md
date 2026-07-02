# AGENTS.md - Foundrie AI Project Context

## Read This First

You are an AI coding agent working on Foundrie AI, a pre-IDE architectural workspace that turns a raw software idea into a complete, implementation-ready package. Foundrie conducts Socratic discovery, surfaces requirements, proposes architecture, generates the full UML/C4/data/infrastructure diagram suite, writes the six context files, writes ordered feature specs, and exports everything as a ZIP that a downstream coding agent (RUWA) can build from with zero ambiguity.

The division of responsibility is absolute: **Foundrie owns what and why; RUWA owns how and when; the human owns approval and judgment.**

The active project kit lives under `project-kit/`. Foundrie's own research corpus lives under `research/`. The full Artkins engineering policy lives at `ARTKINS_STYLE_GUIDE.md`.

## Mandatory Reading Order

1. `ARTKINS_STYLE_GUIDE.md` — full engineering, UX, security, scalability, agent, and no-AI-slope policy.
2. `research/PROJECT_RESEARCH.md` — research index and how the versioned corpus informs implementation.
3. `research/FOUNDRIE_RESEARCH.md` — consolidated master product and implementation research (v1.0.0 → v14.0.0 flattened).
4. `research/FOUNDRIE_V*.md` — the specific versioned file(s) relevant to the current feature, when you need the changelog or exact wording.
5. `project-kit/context/project-overview.md` — product definition, users, dynamic phase flow (scales from simple to complex), scope, success criteria.
6. `project-kit/context/architecture-context.md` — four-layer stack, system boundaries, AI orchestration, storage, database, APIs, invariants.
7. `project-kit/context/build-plan.md` — phase-by-phase implementation plan with UI-first approach, clear done criteria.
8. `project-kit/context/code-standards.md` — Foundrie-specific standards that extend the Artkins guide.
9. `project-kit/context/library-docs.md` — third-party library usage patterns and project-specific integration rules.
10. `project-kit/context/ui-tokens.md` — design system tokens (colors, typography, spacing, radius, motion).
11. `project-kit/context/ui-rules.md` — UI behavior patterns, layout rules, component interaction standards.
12. `project-kit/context/ui-registry.md` — component library, usage patterns, when to use each component.
13. `project-kit/context/ai-workflow-rules.md` — how agents work, split tasks, use Context7, and keep docs synchronized.
14. `project-kit/context/progress-tracker.md` — current state, next steps, open questions, session notes.

## The Research Corpus Is Cumulative

The `research/FOUNDRIE_V*.md` files are append-only. `FOUNDRIE_V1.0.0.md` is the foundation; each later version documents only what changed, and all prior content remains in force. `FOUNDRIE_RESEARCH.md` flattens the whole history into the current state. When two sources disagree, the higher-numbered versioned file wins. Material shifts you must internalize:

- **Foundrie's own stack is a four-layer polyglot architecture** (v2.0.0): Rust execution layer (Axum/Tokio — ZIP, key rotation, file ingestion, diagram rendering, WASM sandbox), Python AI layer (LangGraph/PydanticAI — discovery, multi-model rotation, RAG), TypeScript web layer (Next.js 16/React Flow/Liveblocks/GSAP), and a Go API gateway (Gin/gRPC). The old v1 Python+FastAPI / TypeScript+JSZip stack is deprecated.
- **Foundrie is diagram-first** (v6.0.0): discovery has dynamic phases (scales from simple to complex projects), no feature spec is written before all applicable diagrams are generated and approved, and every ZIP includes `diagrams/`.
- **Dynamic phase completion** (v15.0.0): The discovery protocol is no longer rigid 8 phases. Projects are classified as SIMPLE (landing pages, portfolios — 3-4 phases, 5-10 messages), STANDARD (SaaS apps — 6-7 phases, 15-25 messages), or COMPLEX (enterprise platforms — 8 phases, 30+ messages). The AI uses semantic analysis to detect when phase requirements are met and auto-advances when appropriate, asking explicit continuation prompts when uncertain.
- **Enhanced discovery UI** (v15.0.0): Chat interface supports file uploads (images, screenshots, videos, documents) via Cloudinary. Fixed scrolling layout (sidebar/header static, only chat scrolls). Auto-scroll to new messages. Premium dark theme with green accents matching Lynx Theme Pro aesthetic.
- **Context architecture expansion** (v15.0.0): From 6 to 9+ specialized context files. `ui-context.md` split into `ui-tokens.md`, `ui-rules.md`, and `ui-registry.md`. Added `build-plan.md` for phase-by-phase planning and `library-docs.md` for third-party integration patterns.

## Required Skills

**CRITICAL DIRECTIVE: AI agents MUST ALWAYS use Context7 and the specific agent skills located in `.agents/skills/` for the technology they are working on.** 

Project-local Context7 skills and specific technology skills are installed in `.agents/skills/`. Before you start implementing, debugging, or changing any code, you must:
1. Check `.agents/skills/` for a relevant skill (e.g., `trigger-tasks`, `clerk-nextjs-patterns`, `liveblocks-best-practices`, etc.).
2. Read the `SKILL.md` file for that technology.
3. Follow the instructions and patterns defined in the skill EXACTLY.

If a specific skill does not exist or you need general API documentation, use the Context7 CLI:

```bash
npx ctx7 library <name> "<specific implementation question>"
npx ctx7 docs <libraryId> "<specific implementation question>"
```

Use known library IDs from `project-kit/context/architecture-context.md` when available. **Do not rely on memory** for current APIs, setup, middleware, storage, Trigger.dev task syntax, Liveblocks patterns, React Flow APIs, Prisma migrations, or Next.js App Router behavior. When working with the database, use the project's defined NPM scripts (`npm run db:generate`, `npm run db:migrate`). For generated projects, never assume Foundrie's own stack is the right stack — use Context7 and official sources to research current stable versions before recommending or committing any framework, language, SDK, library, or package version.

## Feature Implementation Order

Feature specs are in `project-kit/feature-specs/`. Implement them in strict numeric order, one spec at a time. Phase names are roadmap labels, not implementation batches. Do not implement `01-06` as a group, do not bundle multiple specs into one pull request, and do not start the next spec until the current one passes review.

For every single feature spec:

1. Read only the current numbered spec and its required context.
2. Create the feature branch before writing any code: `git checkout master && git pull && git checkout -b feature/NN-slug`.
3. Present a concrete implementation plan (with Context7-discovered prerequisites and required inputs) and wait for explicit user approval.
4. Implement that spec within its scope.
5. Write unit tests for the feature's core logic, API routes, and critical paths. Run `npm run test` and `npm run build`.
6. Update `project-kit/context/progress-tracker.md` **on the feature branch**: move the current spec to Completed (mark DONE), clear In Progress, set Current Goal and Next Up to the next numbered spec, and add a session note. The tracker must always end a feature pointing at the next feature to implement.
7. Commit the implementation together with the progress-tracker update on the feature branch, so the tracker travels with the branch and is current the moment the branch merges. Never commit the tracker update directly to `master`.
8. Push the branch to GitHub.
9. We wait for the user to do CodeRabbit review in GitHub. While not mandatory, it is highly recommended as a quality gate to catch issues early.
10. Fix every GitHub CodeRabbit finding and push again. Repeat until there are no unresolved findings (if the user chose to use it).
11. Mark the feature done only after tests pass, build passes, and all required gates pass. The user merges the PR to `master` manually; do not merge unless explicitly asked. After the user confirms the merge, sync local `master` (`git checkout master && git pull`) before starting the next spec — the pulled tracker already points to it.

Never skip ahead, batch specs, or mark a spec done before the GitHub review loop is clean (if used) unless the user explicitly changes the plan.

## Hard Rules

0. **Contract synchronization is a hard gate.** Whenever an implementation changes or corrects any project contract — database schema fields/relations, route signatures, authorization helper signatures, AI task names or `callAI`/`callAIStream` request/response shapes, status enums, storage paths, ZIP structure, generated file contents, package versions, environment variables, or ownership/file boundaries — update the same branch's affected feature spec, every later feature spec that depends on that contract, all relevant context files, this `AGENTS.md`, and `progress-tracker.md` before tests/build/review. Do not leave future specs with stale names, old API shapes, or invalid fields. If a needed contract is missing or ambiguous, record the correction instead of inventing behavior silently.

1. Root `AGENTS.md` is the only active agent entry point. Do not create duplicate context-level AGENTS files.
2. `ARTKINS_STYLE_GUIDE.md` is mandatory and must be preserved verbatim in Foundrie and every generated project export — never summarized.
3. Plan before implementation. Show the user a concrete plan before architecture generation, diagram generation, context/spec generation, skill generation, ZIP packaging, or coding-agent implementation. Execute implementation-impacting work only after explicit approval; if the user revises the plan, update and re-present it before executing. Passive discovery chat, upload intake, link collection, and research summarization may continue before approval.
4. Foundrie's own stack is fixed by `architecture-context.md` (four-layer polyglot). Generated project stacks are dynamic and selected through research, user preference, trade-off explanation, and approval. Never copy Foundrie's stack into a generated project unless the user chooses it or research justifies it.
5. Before committing package versions in generated specs, use Context7 and official release/install sources. Do not hardcode stale framework baselines. Model IDs are always pinned to an exact version — never `"latest"`.
6. Diagram-first gate: no feature spec is written and no ZIP is assembled until all applicable diagrams are generated and human-approved. Every ZIP includes `diagrams/`; a ZIP without it is invalid. The Feature DAG drives spec ordering. RUWA reads diagrams before context files and never implements a table, route, or component not present in the corresponding diagram.
7. All AI calls go through the rotation engine. Direct provider calls are allowed only inside provider adapters. Free-tier users route to DeepSeek R1; paid users to Claude Sonnet 4 — derived from the subscription plan, never hardcoded per endpoint.
8. Route handlers stay thin. Long-running work (AI generation, diagram batches, context/spec generation, ZIP packaging) belongs in Trigger.dev tasks with retries and idempotency keys.
9. Clerk owns authentication; Foundrie code owns authorization. Every user-owned read, update, and delete must scope by authenticated local `user.id`; never trust `userId` from request input. Ownership failures return 404, not 403.
10. Foundrie uses a 2-role authorization model: **Owner** (creates the project, manages settings and members) and **Collaborator** (edits canvas, diagrams, uses AI generation, downloads ZIP). Use `requireProjectOwner()` for owner-only operations and `requireProjectMember()` for shared operations. Do not build custom admin portals, PostgreSQL RLS, ABAC, audit logs, or hardware-key admin controls unless a later spec explicitly requires them.
11. Every feature spec and generated project spec is one feature only, with exact dependencies, exact files, `Files Owned`, Out of Scope, Future Modifications, and binary acceptance criteria. No two active specs own the same file.
12. PostgreSQL stores relational metadata. Vercel Blob stores generated artifacts (ZIPs, diagram PNGs, canvas snapshots, large generated documents). MongoDB Atlas (isolated from Neon) stores anonymized training data only.
13. Diagram generation is sequential, status-driven, and recoverable. One failed diagram must not cancel the batch. Diagrams are versioned; `progress-tracker.md` records which diagram version each spec was written from.
14. Run `npm run security:all` (SAST, dependency audit, secret detection) before every push. Dependency audit is a hard CI gate — no critical or high CVEs. Never delete or gitignore the lock file; lock-file changes require review.
15. Structured JSON logging only — `console.log` is never the logging mechanism in Foundrie code or generated code. Every request carries a UUID request ID; logs correlate by `trace_id`. PII is scrubbed before emission.
16. The exported ZIP structure is a product contract. Do not rename folders or omit required files without updating the architecture context. Generated packages must include root `AGENTS.md`, root `ARTKINS_STYLE_GUIDE.md`, `context/`, `feature-specs/`, `diagrams/`, `requirements/`, `project-management/`, `docs/`, and `research/PROJECT_RESEARCH.md`. Include `.agents/skills/`, `tools/`, `evals/`, and research subfolders only when populated.
17. Research artifacts are part of the implementation contract. Feature specs reference relevant `research/` files and assets when design, motion, source, or technical decisions depend on them. Foundrie's own features must also use `research/` as input whenever research influenced the architecture or spec.
18. Every recommendation cites a source (benchmark, case study, documented failure mode, or cited best practice). Foundrie never says "best practice" without a reference.
19. Update `context/progress-tracker.md` after meaningful implementation changes, and at the end of every feature update it to point at the next feature to implement (current spec → Completed/DONE, In Progress cleared, Current Goal and Next Up set to the next spec, session note added). Commit and push this tracker update on the feature branch with the implementation — never directly to `master` — so a merged branch always lands a tracker that already points to the next feature. If a requirement is missing, record it in `progress-tracker.md` before inventing behavior — do not invent product behavior that is not documented.
20. A configured test harness is mandatory and baked in from the first feature, in Foundrie and in every generated project. The TypeScript layer uses Vitest + React Testing Library + jsdom with `test`/`test:watch`/`test:coverage` scripts (`npm run test` is a non-watch single run); generated non-TS stacks use the idiomatic equivalent (`pytest`, `cargo test`, `go test`) selected through research and recorded in the architecture context. A feature is done only when its new logic has tests and `npm run test` and `npm run build` both pass. Never copy Foundrie's runner into a project that does not use that stack, and never defer the harness to a later feature.
21. Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within the feature spec that introduces them.
22. Every feature spec MUST explicitly include this instruction: "For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed."
23. Every feature spec MUST ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens, executable `npm run security:all` gates) is also baked into the generated projects, ensuring they are premium products.


## When To Split A Task

Split work that combines: auth changes and AI workflow changes; canvas interaction and ZIP packaging; database schema and UI redesign; multiple unrelated API route groups; or behavior not defined in the context files or current spec. Prefer the smallest verifiable increment over broad speculative rewrites. Build only what the current spec requires; never prebuild future behavior.


<!-- TRIGGER.DEV basic START -->
# Trigger.dev Basic Tasks (v4)

**MUST use `@trigger.dev/sdk`, NEVER `client.defineJob`**

## Basic Task

```ts
import { task } from "@trigger.dev/sdk";

export const processData = task({
  id: "process-data",
  retry: {
    maxAttempts: 10,
    factor: 1.8,
    minTimeoutInMs: 500,
    maxTimeoutInMs: 30_000,
    randomize: false,
  },
  run: async (payload: { userId: string; data: any[] }) => {
    // Task logic - runs for long time, no timeouts
    console.log(`Processing ${payload.data.length} items for user ${payload.userId}`);
    return { processed: payload.data.length };
  },
});
```

## Schema Task (with validation)

```ts
import { schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

export const validatedTask = schemaTask({
  id: "validated-task",
  schema: z.object({
    name: z.string(),
    age: z.number(),
    email: z.string().email(),
  }),
  run: async (payload) => {
    // Payload is automatically validated and typed
    return { message: `Hello ${payload.name}, age ${payload.age}` };
  },
});
```

## Triggering Tasks

### From Backend Code

```ts
import { tasks } from "@trigger.dev/sdk";
import type { processData } from "./trigger/tasks";

// Single trigger
const handle = await tasks.trigger<typeof processData>("process-data", {
  userId: "123",
  data: [{ id: 1 }, { id: 2 }],
});

// Batch trigger (up to 1,000 items, 3MB per payload)
const batchHandle = await tasks.batchTrigger<typeof processData>("process-data", [
  { payload: { userId: "123", data: [{ id: 1 }] } },
  { payload: { userId: "456", data: [{ id: 2 }] } },
]);
```

### Debounced Triggering

Consolidate multiple triggers into a single execution:

```ts
// Multiple rapid triggers with same key = single execution
await myTask.trigger(
  { userId: "123" },
  {
    debounce: {
      key: "user-123-update",  // Unique key for debounce group
      delay: "5s",              // Wait before executing
    },
  }
);

// Trailing mode: use payload from LAST trigger
await myTask.trigger(
  { data: "latest-value" },
  {
    debounce: {
      key: "trailing-example",
      delay: "10s",
      mode: "trailing",  // Default is "leading" (first payload)
    },
  }
);
```

**Debounce modes:**
- `leading` (default): Uses payload from first trigger, subsequent triggers only reschedule
- `trailing`: Uses payload from most recent trigger

### From Inside Tasks (with Result handling)

```ts
export const parentTask = task({
  id: "parent-task",
  run: async (payload) => {
    // Trigger and continue
    const handle = await childTask.trigger({ data: "value" });

    // Trigger and wait - returns Result object, NOT task output
    const result = await childTask.triggerAndWait({ data: "value" });
    if (result.ok) {
      console.log("Task output:", result.output); // Actual task return value
    } else {
      console.error("Task failed:", result.error);
    }

    // Quick unwrap (throws on error)
    const output = await childTask.triggerAndWait({ data: "value" }).unwrap();

    // Batch trigger and wait
    const results = await childTask.batchTriggerAndWait([
      { payload: { data: "item1" } },
      { payload: { data: "item2" } },
    ]);

    for (const run of results) {
      if (run.ok) {
        console.log("Success:", run.output);
      } else {
        console.log("Failed:", run.error);
      }
    }
  },
});

export const childTask = task({
  id: "child-task",
  run: async (payload: { data: string }) => {
    return { processed: payload.data };
  },
});
```

> Never wrap triggerAndWait or batchTriggerAndWait calls in a Promise.all or Promise.allSettled as this is not supported in Trigger.dev tasks.

## Waits

```ts
import { task, wait } from "@trigger.dev/sdk";

export const taskWithWaits = task({
  id: "task-with-waits",
  run: async (payload) => {
    console.log("Starting task");

    // Wait for specific duration
    await wait.for({ seconds: 30 });
    await wait.for({ minutes: 5 });
    await wait.for({ hours: 1 });
    await wait.for({ days: 1 });

    // Wait until specific date
    await wait.until({ date: new Date("2024-12-25") });

    // Wait for token (from external system)
    await wait.forToken({
      token: "user-approval-token",
      timeoutInSeconds: 3600, // 1 hour timeout
    });

    console.log("All waits completed");
    return { status: "completed" };
  },
});
```

> Never wrap wait calls in a Promise.all or Promise.allSettled as this is not supported in Trigger.dev tasks.

## Key Points

- **Result vs Output**: `triggerAndWait()` returns a `Result` object with `ok`, `output`, `error` properties - NOT the direct task output
- **Type safety**: Use `import type` for task references when triggering from backend
- **Waits > 5 seconds**: Automatically checkpointed, don't count toward compute usage
- **Debounce + idempotency**: Idempotency keys take precedence over debounce settings

## NEVER Use (v2 deprecated)

```ts
// BREAKS APPLICATION
client.defineJob({
  id: "job-id",
  run: async (payload, io) => {
    /* ... */
  },
});
```

Use SDK (`@trigger.dev/sdk`), check `result.ok` before accessing `result.output`

<!-- TRIGGER.DEV basic END -->

<!-- TRIGGER.DEV advanced-tasks START -->
# Trigger.dev Advanced Tasks (v4)

**Advanced patterns and features for writing tasks**

## Tags & Organization

```ts
import { task, tags } from "@trigger.dev/sdk";

export const processUser = task({
  id: "process-user",
  run: async (payload: { userId: string; orgId: string }, { ctx }) => {
    // Add tags during execution
    await tags.add(`user_${payload.userId}`);
    await tags.add(`org_${payload.orgId}`);

    return { processed: true };
  },
});

// Trigger with tags
await processUser.trigger(
  { userId: "123", orgId: "abc" },
  { tags: ["priority", "user_123", "org_abc"] } // Max 10 tags per run
);

// Subscribe to tagged runs
for await (const run of runs.subscribeToRunsWithTag("user_123")) {
  console.log(`User task ${run.id}: ${run.status}`);
}
```

**Tag Best Practices:**

- Use prefixes: `user_123`, `org_abc`, `video:456`
- Max 10 tags per run, 1-64 characters each
- Tags don't propagate to child tasks automatically

## Batch Triggering v2

Enhanced batch triggering with larger payloads and streaming ingestion.

### Limits

- **Maximum batch size**: 1,000 items (increased from 500)
- **Payload per item**: 3MB each (increased from 1MB combined)
- Payloads > 512KB automatically offload to object storage

### Rate Limiting (per environment)

| Tier | Bucket Size | Refill Rate |
|------|-------------|-------------|
| Free | 1,200 runs | 100 runs/10 sec |
| Hobby | 5,000 runs | 500 runs/5 sec |
| Pro | 5,000 runs | 500 runs/5 sec |

### Concurrent Batch Processing

| Tier | Concurrent Batches |
|------|-------------------|
| Free | 1 |
| Hobby | 10 |
| Pro | 10 |

### Usage

```ts
import { myTask } from "./trigger/myTask";

// Basic batch trigger (up to 1,000 items)
const runs = await myTask.batchTrigger([
  { payload: { userId: "user-1" } },
  { payload: { userId: "user-2" } },
  { payload: { userId: "user-3" } },
]);

// Batch trigger with wait
const results = await myTask.batchTriggerAndWait([
  { payload: { userId: "user-1" } },
  { payload: { userId: "user-2" } },
]);

for (const result of results) {
  if (result.ok) {
    console.log("Result:", result.output);
  }
}

// With per-item options
const batchHandle = await myTask.batchTrigger([
  {
    payload: { userId: "123" },
    options: {
      idempotencyKey: "user-123-batch",
      tags: ["priority"],
    },
  },
  {
    payload: { userId: "456" },
    options: {
      idempotencyKey: "user-456-batch",
    },
  },
]);
```

## Debouncing

Consolidate multiple triggers into a single execution by debouncing task runs with a unique key and delay window.

### Use Cases

- **User activity updates**: Batch rapid user actions into a single run
- **Webhook deduplication**: Handle webhook bursts without redundant processing
- **Search indexing**: Combine document updates instead of processing individually
- **Notification batching**: Group notifications to prevent user spam

### Basic Usage

```ts
await myTask.trigger(
  { userId: "123" },
  {
    debounce: {
      key: "user-123-update",  // Unique identifier for debounce group
      delay: "5s",              // Wait duration ("5s", "1m", or milliseconds)
    },
  }
);
```

### Execution Modes

**Leading Mode** (default): Uses payload/options from the first trigger; subsequent triggers only reschedule execution time.

```ts
// First trigger sets the payload
await myTask.trigger({ action: "first" }, {
  debounce: { key: "my-key", delay: "10s" }
});

// Second trigger only reschedules - payload remains "first"
await myTask.trigger({ action: "second" }, {
  debounce: { key: "my-key", delay: "10s" }
});
// Task executes with { action: "first" }
```

**Trailing Mode**: Uses payload/options from the most recent trigger.

```ts
await myTask.trigger(
  { data: "latest-value" },
  {
    debounce: {
      key: "trailing-example",
      delay: "10s",
      mode: "trailing",
    },
  }
);
```

In trailing mode, these options update with each trigger:
- `payload` — task input data
- `metadata` — run metadata
- `tags` — run tags (replaces existing)
- `maxAttempts` — retry attempts
- `maxDuration` — maximum compute time
- `machine` — machine preset

### Important Notes

- Idempotency keys take precedence over debounce settings
- Compatible with `triggerAndWait()` — parent runs block correctly on debounced execution
- Debounce key is scoped to the task

## Concurrency & Queues

```ts
import { task, queue } from "@trigger.dev/sdk";

// Shared queue for related tasks
const emailQueue = queue({
  name: "email-processing",
  concurrencyLimit: 5, // Max 5 emails processing simultaneously
});

// Task-level concurrency
export const oneAtATime = task({
  id: "sequential-task",
  queue: { concurrencyLimit: 1 }, // Process one at a time
  run: async (payload) => {
    // Critical section - only one instance runs
  },
});

// Per-user concurrency
export const processUserData = task({
  id: "process-user-data",
  run: async (payload: { userId: string }) => {
    // Override queue with user-specific concurrency
    await childTask.trigger(payload, {
      queue: {
        name: `user-${payload.userId}`,
        concurrencyLimit: 2,
      },
    });
  },
});

export const emailTask = task({
  id: "send-email",
  queue: emailQueue, // Use shared queue
  run: async (payload: { to: string }) => {
    // Send email logic
  },
});
```

## Error Handling & Retries

```ts
import { task, retry, AbortTaskRunError } from "@trigger.dev/sdk";

export const resilientTask = task({
  id: "resilient-task",
  retry: {
    maxAttempts: 10,
    factor: 1.8, // Exponential backoff multiplier
    minTimeoutInMs: 500,
    maxTimeoutInMs: 30_000,
    randomize: false,
  },
  catchError: async ({ error, ctx }) => {
    // Custom error handling
    if (error.code === "FATAL_ERROR") {
      throw new AbortTaskRunError("Cannot retry this error");
    }

    // Log error details
    console.error(`Task ${ctx.task.id} failed:`, error);

    // Allow retry by returning nothing
    return { retryAt: new Date(Date.now() + 60000) }; // Retry in 1 minute
  },
  run: async (payload) => {
    // Retry specific operations
    const result = await retry.onThrow(
      async () => {
        return await unstableApiCall(payload);
      },
      { maxAttempts: 3 }
    );

    // Conditional HTTP retries
    const response = await retry.fetch("https://api.example.com", {
      retry: {
        maxAttempts: 5,
        condition: (response, error) => {
          return response?.status === 429 || response?.status >= 500;
        },
      },
    });

    return result;
  },
});
```

## Machines & Performance

```ts
export const heavyTask = task({
  id: "heavy-computation",
  machine: { preset: "large-2x" }, // 8 vCPU, 16 GB RAM
  maxDuration: 1800, // 30 minutes timeout
  run: async (payload, { ctx }) => {
    // Resource-intensive computation
    if (ctx.machine.preset === "large-2x") {
      // Use all available cores
      return await parallelProcessing(payload);
    }

    return await standardProcessing(payload);
  },
});

// Override machine when triggering
await heavyTask.trigger(payload, {
  machine: { preset: "medium-1x" }, // Override for this run
});
```

**Machine Presets:**

- `micro`: 0.25 vCPU, 0.25 GB RAM
- `small-1x`: 0.5 vCPU, 0.5 GB RAM (default)
- `small-2x`: 1 vCPU, 1 GB RAM
- `medium-1x`: 1 vCPU, 2 GB RAM
- `medium-2x`: 2 vCPU, 4 GB RAM
- `large-1x`: 4 vCPU, 8 GB RAM
- `large-2x`: 8 vCPU, 16 GB RAM

## Idempotency

```ts
import { task, idempotencyKeys } from "@trigger.dev/sdk";

export const paymentTask = task({
  id: "process-payment",
  retry: {
    maxAttempts: 3,
  },
  run: async (payload: { orderId: string; amount: number }) => {
    // Automatically scoped to this task run, so if the task is retried, the idempotency key will be the same
    const idempotencyKey = await idempotencyKeys.create(`payment-${payload.orderId}`);

    // Ensure payment is processed only once
    await chargeCustomer.trigger(payload, {
      idempotencyKey,
      idempotencyKeyTTL: "24h", // Key expires in 24 hours
    });
  },
});

// Payload-based idempotency
import { createHash } from "node:crypto";

function createPayloadHash(payload: any): string {
  const hash = createHash("sha256");
  hash.update(JSON.stringify(payload));
  return hash.digest("hex");
}

export const deduplicatedTask = task({
  id: "deduplicated-task",
  run: async (payload) => {
    const payloadHash = createPayloadHash(payload);
    const idempotencyKey = await idempotencyKeys.create(payloadHash);

    await processData.trigger(payload, { idempotencyKey });
  },
});
```

## Metadata & Progress Tracking

```ts
import { task, metadata } from "@trigger.dev/sdk";

export const batchProcessor = task({
  id: "batch-processor",
  run: async (payload: { items: any[] }, { ctx }) => {
    const totalItems = payload.items.length;

    // Initialize progress metadata
    metadata
      .set("progress", 0)
      .set("totalItems", totalItems)
      .set("processedItems", 0)
      .set("status", "starting");

    const results = [];

    for (let i = 0; i < payload.items.length; i++) {
      const item = payload.items[i];

      // Process item
      const result = await processItem(item);
      results.push(result);

      // Update progress
      const progress = ((i + 1) / totalItems) * 100;
      metadata
        .set("progress", progress)
        .increment("processedItems", 1)
        .append("logs", `Processed item ${i + 1}/${totalItems}`)
        .set("currentItem", item.id);
    }

    // Final status
    metadata.set("status", "completed");

    return { results, totalProcessed: results.length };
  },
});

// Update parent metadata from child task
export const childTask = task({
  id: "child-task",
  run: async (payload, { ctx }) => {
    // Update parent task metadata
    metadata.parent.set("childStatus", "processing");
    metadata.root.increment("childrenCompleted", 1);

    return { processed: true };
  },
});
```

## Logging & Tracing

```ts
import { task, logger } from "@trigger.dev/sdk";

export const tracedTask = task({
  id: "traced-task",
  run: async (payload, { ctx }) => {
    logger.info("Task started", { userId: payload.userId });

    // Custom trace with attributes
    const user = await logger.trace(
      "fetch-user",
      async (span) => {
        span.setAttribute("user.id", payload.userId);
        span.setAttribute("operation", "database-fetch");

        const userData = await database.findUser(payload.userId);
        span.setAttribute("user.found", !!userData);

        return userData;
      },
      { userId: payload.userId }
    );

    logger.debug("User fetched", { user: user.id });

    try {
      const result = await processUser(user);
      logger.info("Processing completed", { result });
      return result;
    } catch (error) {
      logger.error("Processing failed", {
        error: error.message,
        userId: payload.userId,
      });
      throw error;
    }
  },
});
```

## Hidden Tasks

```ts
// Hidden task - not exported, only used internally
const internalProcessor = task({
  id: "internal-processor",
  run: async (payload: { data: string }) => {
    return { processed: payload.data.toUpperCase() };
  },
});

// Public task that uses hidden task
export const publicWorkflow = task({
  id: "public-workflow",
  run: async (payload: { input: string }) => {
    // Use hidden task internally
    const result = await internalProcessor.triggerAndWait({
      data: payload.input,
    });

    if (result.ok) {
      return { output: result.output.processed };
    }

    throw new Error("Internal processing failed");
  },
});
```

## Best Practices

- **Concurrency**: Use queues to prevent overwhelming external services
- **Retries**: Configure exponential backoff for transient failures
- **Idempotency**: Always use for payment/critical operations
- **Metadata**: Track progress for long-running tasks
- **Machines**: Match machine size to computational requirements
- **Tags**: Use consistent naming patterns for filtering
- **Debouncing**: Use for user activity, webhooks, and notification batching
- **Batch triggering**: Use for bulk operations up to 1,000 items
- **Error Handling**: Distinguish between retryable and fatal errors

Design tasks to be stateless, idempotent, and resilient to failures. Use metadata for state tracking and queues for resource management.

<!-- TRIGGER.DEV advanced-tasks END -->

<!-- TRIGGER.DEV config START -->
# Trigger.dev Configuration (v4)

**Complete guide to configuring `trigger.config.ts` with build extensions**

## Basic Configuration

```ts
import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: "<project-ref>", // Required: Your project reference
  dirs: ["./trigger"], // Task directories
  runtime: "node", // "node", "node-22", or "bun"
  logLevel: "info", // "debug", "info", "warn", "error"

  // Default retry settings
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },

  // Build configuration
  build: {
    autoDetectExternal: true,
    keepNames: true,
    minify: false,
    extensions: [], // Build extensions go here
  },

  // Global lifecycle hooks
  onStartAttempt: async ({ payload, ctx }) => {
    console.log("Global task start");
  },
  onSuccess: async ({ payload, output, ctx }) => {
    console.log("Global task success");
  },
  onFailure: async ({ payload, error, ctx }) => {
    console.log("Global task failure");
  },
});
```

## Build Extensions

### Database & ORM

#### Prisma

```ts
import { prismaExtension } from "@trigger.dev/build/extensions/prisma";

extensions: [
  prismaExtension({
    schema: "prisma/schema.prisma",
    version: "5.19.0", // Optional: specify version
    migrate: true, // Run migrations during build
    directUrlEnvVarName: "DIRECT_DATABASE_URL",
    typedSql: true, // Enable TypedSQL support
  }),
];
```

#### TypeScript Decorators (for TypeORM)

```ts
import { emitDecoratorMetadata } from "@trigger.dev/build/extensions/typescript";

extensions: [
  emitDecoratorMetadata(), // Enables decorator metadata
];
```

### Scripting Languages

#### Python

```ts
import { pythonExtension } from "@trigger.dev/build/extensions/python";

extensions: [
  pythonExtension({
    scripts: ["./python/**/*.py"], // Copy Python files
    requirementsFile: "./requirements.txt", // Install packages
    devPythonBinaryPath: ".venv/bin/python", // Dev mode binary
  }),
];

// Usage in tasks
const result = await python.runInline(`print("Hello, world!")`);
const output = await python.runScript("./python/script.py", ["arg1"]);
```

### Browser Automation

#### Playwright

```ts
import { playwright } from "@trigger.dev/build/extensions/playwright";

extensions: [
  playwright({
    browsers: ["chromium", "firefox", "webkit"], // Default: ["chromium"]
    headless: true, // Default: true
  }),
];
```

#### Puppeteer

```ts
import { puppeteer } from "@trigger.dev/build/extensions/puppeteer";

extensions: [puppeteer()];

// Environment variable needed:
// PUPPETEER_EXECUTABLE_PATH: "/usr/bin/google-chrome-stable"
```

#### Lightpanda

```ts
import { lightpanda } from "@trigger.dev/build/extensions/lightpanda";

extensions: [
  lightpanda({
    version: "latest", // or "nightly"
    disableTelemetry: false,
  }),
];
```

### Media Processing

#### FFmpeg

```ts
import { ffmpeg } from "@trigger.dev/build/extensions/core";

extensions: [
  ffmpeg({ version: "7" }), // Static build, or omit for Debian version
];

// Automatically sets FFMPEG_PATH and FFPROBE_PATH
// Add fluent-ffmpeg to external packages if using
```

#### Audio Waveform

```ts
import { audioWaveform } from "@trigger.dev/build/extensions/audioWaveform";

extensions: [
  audioWaveform(), // Installs Audio Waveform 1.1.0
];
```

### System & Package Management

#### System Packages (apt-get)

```ts
import { aptGet } from "@trigger.dev/build/extensions/core";

extensions: [
  aptGet({
    packages: ["ffmpeg", "imagemagick", "curl=7.68.0-1"], // Can specify versions
  }),
];
```

#### Additional NPM Packages

Only use this for installing CLI tools, NOT packages you import in your code.

```ts
import { additionalPackages } from "@trigger.dev/build/extensions/core";

extensions: [
  additionalPackages({
    packages: ["wrangler"], // CLI tools and specific versions
  }),
];
```

#### Additional Files

```ts
import { additionalFiles } from "@trigger.dev/build/extensions/core";

extensions: [
  additionalFiles({
    files: ["wrangler.toml", "./assets/**", "./fonts/**"], // Glob patterns supported
  }),
];
```

### Environment & Build Tools

#### Environment Variable Sync

```ts
import { syncEnvVars } from "@trigger.dev/build/extensions/core";

extensions: [
  syncEnvVars(async (ctx) => {
    // ctx contains: environment, projectRef, env
    return [
      { name: "SECRET_KEY", value: await getSecret(ctx.environment) },
      { name: "API_URL", value: ctx.environment === "prod" ? "api.prod.com" : "api.dev.com" },
    ];
  }),
];
```

#### ESBuild Plugins

```ts
import { esbuildPlugin } from "@trigger.dev/build/extensions";
import { sentryEsbuildPlugin } from "@sentry/esbuild-plugin";

extensions: [
  esbuildPlugin(
    sentryEsbuildPlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
    { placement: "last", target: "deploy" } // Optional config
  ),
];
```

## Custom Build Extensions

```ts
import { defineConfig } from "@trigger.dev/sdk";

const customExtension = {
  name: "my-custom-extension",

  externalsForTarget: (target) => {
    return ["some-native-module"]; // Add external dependencies
  },

  onBuildStart: async (context) => {
    console.log(`Build starting for ${context.target}`);
    // Register esbuild plugins, modify build context
  },

  onBuildComplete: async (context, manifest) => {
    console.log("Build complete, adding layers");
    // Add build layers, modify deployment
    context.addLayer({
      id: "my-layer",
      files: [{ source: "./custom-file", destination: "/app/custom" }],
      commands: ["chmod +x /app/custom"],
    });
  },
};

export default defineConfig({
  project: "my-project",
  build: {
    extensions: [customExtension],
  },
});
```

## Advanced Configuration

### Telemetry

```ts
import { PrismaInstrumentation } from "@prisma/instrumentation";
import { OpenAIInstrumentation } from "@langfuse/openai";

export default defineConfig({
  // ... other config
  telemetry: {
    instrumentations: [new PrismaInstrumentation(), new OpenAIInstrumentation()],
    exporters: [customExporter], // Optional custom exporters
  },
});
```

### Machine & Performance

```ts
export default defineConfig({
  // ... other config
  defaultMachine: "large-1x", // Default machine for all tasks
  maxDuration: 300, // Default max duration (seconds)
  enableConsoleLogging: true, // Console logging in development
});
```

## Common Extension Combinations

### Full-Stack Web App

```ts
extensions: [
  prismaExtension({ schema: "prisma/schema.prisma", migrate: true }),
  additionalFiles({ files: ["./public/**", "./assets/**"] }),
  syncEnvVars(async (ctx) => [...envVars]),
];
```

### AI/ML Processing

```ts
extensions: [
  pythonExtension({
    scripts: ["./ai/**/*.py"],
    requirementsFile: "./requirements.txt",
  }),
  ffmpeg({ version: "7" }),
  additionalPackages({ packages: ["wrangler"] }),
];
```

### Web Scraping

```ts
extensions: [
  playwright({ browsers: ["chromium"] }),
  puppeteer(),
  additionalFiles({ files: ["./selectors.json", "./proxies.txt"] }),
];
```

## Best Practices

- **Use specific versions**: Pin extension versions for reproducible builds
- **External packages**: Add modules with native addons to the `build.external` array
- **Environment sync**: Use `syncEnvVars` for dynamic secrets
- **File paths**: Use glob patterns for flexible file inclusion
- **Debug builds**: Use `--log-level debug --dry-run` for troubleshooting

Extensions only affect deployment, not local development. Use `external` array for packages that shouldn't be bundled.

<!-- TRIGGER.DEV config END -->

<!-- TRIGGER.DEV scheduled-tasks START -->
# Scheduled tasks (cron)

Recurring tasks using cron. For one-off future runs, use the **delay** option.

## Define a scheduled task

```ts
import { schedules } from "@trigger.dev/sdk";

export const task = schedules.task({
  id: "first-scheduled-task",
  run: async (payload) => {
    payload.timestamp; // Date (scheduled time, UTC)
    payload.lastTimestamp; // Date | undefined
    payload.timezone; // IANA, e.g. "America/New_York" (default "UTC")
    payload.scheduleId; // string
    payload.externalId; // string | undefined
    payload.upcoming; // Date[]

    payload.timestamp.toLocaleString("en-US", { timeZone: payload.timezone });
  },
});
```

> Scheduled tasks need at least one schedule attached to run.

## Attach schedules

**Declarative (sync on dev/deploy):**

```ts
schedules.task({
  id: "every-2h",
  cron: "0 */2 * * *", // UTC
  run: async () => {},
});

schedules.task({
  id: "tokyo-5am",
  cron: { pattern: "0 5 * * *", timezone: "Asia/Tokyo", environments: ["PRODUCTION", "STAGING"] },
  run: async () => {},
});
```

**Imperative (SDK or dashboard):**

```ts
await schedules.create({
  task: task.id,
  cron: "0 0 * * *",
  timezone: "America/New_York", // DST-aware
  externalId: "user_123",
  deduplicationKey: "user_123-daily", // updates if reused
});
```

### Dynamic / multi-tenant example

```ts
// /trigger/reminder.ts
export const reminderTask = schedules.task({
  id: "todo-reminder",
  run: async (p) => {
    if (!p.externalId) throw new Error("externalId is required");
    const user = await db.getUser(p.externalId);
    await sendReminderEmail(user);
  },
});
```

```ts
// app/reminders/route.ts
export async function POST(req: Request) {
  const data = await req.json();
  return Response.json(
    await schedules.create({
      task: reminderTask.id,
      cron: "0 8 * * *",
      timezone: data.timezone,
      externalId: data.userId,
      deduplicationKey: `${data.userId}-reminder`,
    })
  );
}
```

## Cron syntax (no seconds)

```
* * * * *
| | | | └ day of week (0–7 or 1L–7L; 0/7=Sun; L=last)
| | | └── month (1–12)
| | └──── day of month (1–31 or L)
| └────── hour (0–23)
└──────── minute (0–59)
```

## When schedules won't trigger

- **Dev:** only when the dev CLI is running.
- **Staging/Production:** only for tasks in the **latest deployment**.

## SDK management (quick refs)

```ts
await schedules.retrieve(id);
await schedules.list();
await schedules.update(id, { cron: "0 0 1 * *", externalId: "ext", deduplicationKey: "key" });
await schedules.deactivate(id);
await schedules.activate(id);
await schedules.del(id);
await schedules.timezones(); // list of IANA timezones
```

## Dashboard

Create/attach schedules visually (Task, Cron pattern, Timezone, Optional: External ID, Dedup key, Environments). Test scheduled tasks from the **Test** page.

<!-- TRIGGER.DEV scheduled-tasks END -->

<!-- TRIGGER.DEV realtime START -->
# Trigger.dev Realtime (v4)

**Real-time monitoring and updates for runs**

## Core Concepts

Realtime allows you to:

- Subscribe to run status changes, metadata updates, and streams
- Build real-time dashboards and UI updates
- Monitor task progress from frontend and backend

## Authentication

### Public Access Tokens

```ts
import { auth } from "@trigger.dev/sdk";

// Read-only token for specific runs
const publicToken = await auth.createPublicToken({
  scopes: {
    read: {
      runs: ["run_123", "run_456"],
      tasks: ["my-task-1", "my-task-2"],
    },
  },
  expirationTime: "1h", // Default: 15 minutes
});
```

### Trigger Tokens (Frontend only)

```ts
// Single-use token for triggering tasks
const triggerToken = await auth.createTriggerPublicToken("my-task", {
  expirationTime: "30m",
});
```

## Backend Usage

### Subscribe to Runs

```ts
import { runs, tasks } from "@trigger.dev/sdk";

// Trigger and subscribe
const handle = await tasks.trigger("my-task", { data: "value" });

// Subscribe to specific run
for await (const run of runs.subscribeToRun<typeof myTask>(handle.id)) {
  console.log(`Status: ${run.status}, Progress: ${run.metadata?.progress}`);
  if (run.status === "COMPLETED") break;
}

// Subscribe to runs with tag
for await (const run of runs.subscribeToRunsWithTag("user-123")) {
  console.log(`Tagged run ${run.id}: ${run.status}`);
}

// Subscribe to batch
for await (const run of runs.subscribeToBatch(batchId)) {
  console.log(`Batch run ${run.id}: ${run.status}`);
}
```

### Realtime Streams v2 (Recommended)

```ts
import { streams, InferStreamType } from "@trigger.dev/sdk";

// 1. Define streams (shared location)
export const aiStream = streams.define<string>({
  id: "ai-output",
});

export type AIStreamPart = InferStreamType<typeof aiStream>;

// 2. Pipe from task
export const streamingTask = task({
  id: "streaming-task",
  run: async (payload) => {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: payload.prompt }],
      stream: true,
    });

    const { waitUntilComplete } = aiStream.pipe(completion);
    await waitUntilComplete();
  },
});

// 3. Read from backend
const stream = await aiStream.read(runId, {
  timeoutInSeconds: 300,
  startIndex: 0, // Resume from specific chunk
});

for await (const chunk of stream) {
  console.log("Chunk:", chunk); // Fully typed
}
```

Enable v2 by upgrading to 4.1.0 or later.

## React Frontend Usage

### Installation

```bash
npm add @trigger.dev/react-hooks
```

### Triggering Tasks

```tsx
"use client";
import { useTaskTrigger, useRealtimeTaskTrigger } from "@trigger.dev/react-hooks";
import type { myTask } from "../trigger/tasks";

function TriggerComponent({ accessToken }: { accessToken: string }) {
  // Basic trigger
  const { submit, handle, isLoading } = useTaskTrigger<typeof myTask>("my-task", {
    accessToken,
  });

  // Trigger with realtime updates
  const {
    submit: realtimeSubmit,
    run,
    isLoading: isRealtimeLoading,
  } = useRealtimeTaskTrigger<typeof myTask>("my-task", { accessToken });

  return (
    <div>
      <button onClick={() => submit({ data: "value" })} disabled={isLoading}>
        Trigger Task
      </button>

      <button onClick={() => realtimeSubmit({ data: "realtime" })} disabled={isRealtimeLoading}>
        Trigger with Realtime
      </button>

      {run && <div>Status: {run.status}</div>}
    </div>
  );
}
```

### Subscribing to Runs

```tsx
"use client";
import { useRealtimeRun, useRealtimeRunsWithTag } from "@trigger.dev/react-hooks";
import type { myTask } from "../trigger/tasks";

function SubscribeComponent({ runId, accessToken }: { runId: string; accessToken: string }) {
  // Subscribe to specific run
  const { run, error } = useRealtimeRun<typeof myTask>(runId, {
    accessToken,
    onComplete: (run) => {
      console.log("Task completed:", run.output);
    },
  });

  // Subscribe to tagged runs
  const { runs } = useRealtimeRunsWithTag("user-123", { accessToken });

  if (error) return <div>Error: {error.message}</div>;
  if (!run) return <div>Loading...</div>;

  return (
    <div>
      <div>Status: {run.status}</div>
      <div>Progress: {run.metadata?.progress || 0}%</div>
      {run.output && <div>Result: {JSON.stringify(run.output)}</div>}

      <h3>Tagged Runs:</h3>
      {runs.map((r) => (
        <div key={r.id}>
          {r.id}: {r.status}
        </div>
      ))}
    </div>
  );
}
```

### Realtime Streams with React

```tsx
"use client";
import { useRealtimeStream } from "@trigger.dev/react-hooks";
import { aiStream } from "../trigger/streams";

function StreamComponent({ runId, accessToken }: { runId: string; accessToken: string }) {
  // Pass defined stream directly for type safety
  const { parts, error } = useRealtimeStream(aiStream, runId, {
    accessToken,
    timeoutInSeconds: 300,
    throttleInMs: 50, // Control re-render frequency
  });

  if (error) return <div>Error: {error.message}</div>;
  if (!parts) return <div>Loading...</div>;

  const text = parts.join(""); // parts is typed as AIStreamPart[]

  return <div>Streamed Text: {text}</div>;
}
```

### Wait Tokens

```tsx
"use client";
import { useWaitToken } from "@trigger.dev/react-hooks";

function WaitTokenComponent({ tokenId, accessToken }: { tokenId: string; accessToken: string }) {
  const { complete } = useWaitToken(tokenId, { accessToken });

  return <button onClick={() => complete({ approved: true })}>Approve Task</button>;
}
```

### SWR Hooks (Fetch Once)

```tsx
"use client";
import { useRun } from "@trigger.dev/react-hooks";
import type { myTask } from "../trigger/tasks";

function SWRComponent({ runId, accessToken }: { runId: string; accessToken: string }) {
  const { run, error, isLoading } = useRun<typeof myTask>(runId, {
    accessToken,
    refreshInterval: 0, // Disable polling (recommended)
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>Run: {run?.status}</div>;
}
```

## Run Object Properties

Key properties available in run subscriptions:

- `id`: Unique run identifier
- `status`: `QUEUED`, `EXECUTING`, `COMPLETED`, `FAILED`, `CANCELED`, etc.
- `payload`: Task input data (typed)
- `output`: Task result (typed, when completed)
- `metadata`: Real-time updatable data
- `createdAt`, `updatedAt`: Timestamps
- `costInCents`: Execution cost

## Best Practices

- **Use Realtime over SWR**: Recommended for most use cases due to rate limits
- **Scope tokens properly**: Only grant necessary read/trigger permissions
- **Handle errors**: Always check for errors in hooks and subscriptions
- **Type safety**: Use task types for proper payload/output typing
- **Cleanup subscriptions**: Backend subscriptions auto-complete, frontend hooks auto-cleanup

<!-- TRIGGER.DEV realtime END -->
