# 05 - AI Rotation Engine

## Goal

Implement the provider abstraction, model task map, fallback chains, and central AI call functions.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Provider API docs through Context7 or primary provider docs
- Next.js `/vercel/next.js`

Use installed Context7 skills or:

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Implementation

- Create `lib/ai/providers/types.ts`.
- Create provider adapters for Gemini, OpenRouter, Groq, and DeepSeek.
- Create `model-routing.ts` with the Foundrie task map.
- Create `fallback-chains.ts` with all configured chains.
- Create `rotation-engine.ts` with `callAI` and `callAIStream`.
- Log every attempt with provider, model, success, error, and duration.
- Add prompt/system-message utilities or shared rules that require plan-before-execution for implementation-impacting AI tasks.
- Ensure provider calls can receive planning-gate instructions from task prompts without bypassing the rotation engine.
- Add tests for fallback selection and all-fail behavior.

## Scope Limits

- Do not implement later feature specs early.
- Do not introduce undocumented architecture changes.
- Do not bypass the storage, auth, AI, or Context7 rules in the context files.

## Check When Done

- The feature works within its defined scope.
- Relevant library docs were checked with Context7.
- Types are strict and external input is validated.
- Access control is enforced where data is read or mutated.
- Implementation-impacting AI prompts can enforce plan, user approval, revision, then execution.
- `context/progress-tracker.md` is updated.
- `npm run build` passes once application code exists.
- All CodeRabbit reviews must pass. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
