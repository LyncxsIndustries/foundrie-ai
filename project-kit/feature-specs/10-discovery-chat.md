# Feature 10 - Discovery Chat

## Type

NEW FEATURE

## What This Delivers

Phase-1 streaming chat for the Socratic requirements interview: conversation persistence, the discovery API, and the streaming UI. The assistant classifies the opening description (Level 1 vague / 2 partially specified / 3 over-specified), asks one question at a time, surfaces hidden requirements, and discovers stack preferences without committing to a stack yet.

## Dependencies

- Feature 05 (AI Rotation Engine) must be complete (`callAIStream` exists).
- Feature 06 (Layout Shell) provides the discovery phase page.

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

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `app/api/conversations/[projectId]/chat/route.ts`
- `components/chat/DiscoveryChat.tsx`
- `components/chat/ChatMessage.tsx`
- `lib/ai/prompts/discovery.ts`
- `lib/conversations/**`

## Files

CREATE: `app/api/conversations/[projectId]/chat/route.ts` - GET history, POST message (streaming).
CREATE: `components/chat/DiscoveryChat.tsx` and `components/chat/ChatMessage.tsx`.
CREATE: conversation model helpers and the discovery system prompt.
MODIFY: `app/(app)/projects/[projectId]/discovery/page.tsx` - mount the chat.

## Implementation Notes

- Use `callAIStream('streaming_chat')` for responsive UI; persist every user and assistant message via the conversation API.
- Discovery system prompt: classify the opening description as Level 1/2/3 and respond accordingly (elicit for Level 1, surface edge cases for Level 2, push back with sourced evidence for Level 3). Ask exactly one question at a time. Surface hidden requirements from the catalog (auth, database, payments, email, API, performance, security).
- Cover stack-preference discovery over the conversation: target platform, preferred languages/frameworks, team experience, deployment target, budget, maintenance expectations, technologies to avoid. Explain trade-offs when stack questions arise; final stack selection happens later after research and approval.
- Use `db` when appending messages. Keep writes bounded; avoid long idle transactions while streaming. Use the `[projectId, phase]` and `[projectId, updatedAt]` indexes. Enforce a message-size limit before storing conversation JSON.
- The AI input field follows the queue state machine semantics; buttons disable on click (idempotency).
- Detect when the conversation is ready for synthesis and signal it to the UI.

## Out of Scope

- Requirements synthesis (Feature 11) and the multi-user input queue (Feature 33).
- Final stack/version decisions and architecture diagrams.

## Future Modifications

- Feature 11: Requirements generation consumes the conversation history.
- Feature 33: Liveblocks presence adds the collaborative input queue state machine.

## Acceptance Criteria

- [ ] The discovery chat streams responses and persists every message.
- [ ] The assistant classifies the opening description and asks one question at a time.
- [ ] Hidden requirements are surfaced during discovery.
- [ ] Stack preferences are captured without forcing Foundrie's own stack.
- [ ] Non-owner access to the conversation route returns 404.
- [ ] Conversation JSON growth is bounded by a message-size limit.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
