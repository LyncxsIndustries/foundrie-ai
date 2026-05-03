# 10 - Discovery Chat

## Goal

Implement phase-one streaming chat for the Socratic requirements interview.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Groq/provider docs
- Next.js `/vercel/next.js`

Use installed Context7 skills or:

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Implementation

- Create conversation model helpers.
- Create `GET/POST /api/conversations/[projectId]/chat`.
- Use `callAIStream('streaming_chat')` for responsive UI.
- Use the discovery system prompt: one question at a time.
- Include stack-preference discovery over the conversation: target platform, preferred languages/frameworks, team experience, deployment target, budget, maintenance expectations, and technologies the user wants to avoid.
- The assistant should explain trade-offs when stack questions arise, but final stack selection happens later after research and approval.
- Persist every user and assistant message.
- Detect when the conversation is ready for synthesis.
- Use `dbWrite` when appending messages.
- Keep writes bounded; avoid long idle transactions while streaming.
- Use the `[projectId, phase]` and `[projectId, updatedAt]` conversation indexes from Feature 03.
- Consider message-size limits before storing conversation JSON so rows do not grow without bounds.

## Scope Limits

- Do not implement later feature specs early.
- Do not introduce undocumented architecture changes.
- Do not bypass the storage, auth, AI, or Context7 rules in the context files.

## Check When Done

- The feature works within its defined scope.
- Relevant library docs were checked with Context7.
- Types are strict and external input is validated.
- Access control is enforced where data is read or mutated.
- Discovery captures user technology preferences without forcing Foundrie's own stack.
- `context/progress-tracker.md` is updated.
- `npm run build` passes once application code exists.
