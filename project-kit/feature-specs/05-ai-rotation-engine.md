# Feature 05 - AI Rotation Engine

## Type

NEW FEATURE

## What This Delivers

The provider abstraction, model task map, fallback chains, and central AI call functions (`callAI`, `callAIStream`). Every AI generation routes through this engine with task-based model selection, a fallback chain per model key, availability checks, and attempt logging. After this feature, no product code calls a provider directly — all AI flows through the rotation engine.

## Dependencies

- Feature 03 (Database Schema) must be complete (logging/persistence targets exist).
- Provider API keys must be available in environment variables.
- Context7 docs for the providers and Next.js must be checked before implementation.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Provider API docs through Context7 or primary provider docs (Gemini, OpenRouter, Groq, DeepSeek, Anthropic)
- Next.js `/vercel/next.js`

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `lib/ai/providers/**`
- `lib/ai/model-routing.ts`
- `lib/ai/fallback-chains.ts`
- `lib/ai/rotation-engine.ts`
- `lib/ai/prompts/**`
- `config/model.yaml`

## Files

CREATE: `lib/ai/providers/types.ts` - `AIProvider`, `AICallParams`, `AIResponse` interfaces.
CREATE: provider adapters for Gemini, OpenRouter, Groq, DeepSeek (and Anthropic).
CREATE: `lib/ai/model-routing.ts` - the Foundrie task map.
CREATE: `lib/ai/fallback-chains.ts` - all configured chains.
CREATE: `lib/ai/rotation-engine.ts` - `callAI` and `callAIStream`.
CREATE: `config/model.yaml` - pinned model IDs (never `"latest"`).
CREATE: shared prompt/system-message utilities that can carry planning-gate instructions.
MODIFY: `.env.example` - provider keys.

## Implementation Notes

- Provider adapters implement `call` and `isAvailable` and live only in `lib/ai/providers/`. Direct external AI calls anywhere else are forbidden.
- `callAI(task, params, overrideModelKey?)` resolves the task to a model key, reads its fallback chain, checks availability, calls the provider, logs the attempt (provider, model, task, success, error, duration), and continues until success or full exhaustion.
- Task map and fallback chains match `architecture-context.md`. The production primary chain across providers is Claude Sonnet 4 → Gemini Pro → DeepSeek R1 → Kimi K2 → Qwen Coder.
- Tier-based primary model selection: derive the primary model from the user's subscription plan (FREE → DeepSeek R1, PRO/ENTERPRISE → Claude Sonnet 4). Never hardcode the model per endpoint.
- Model IDs are pinned to exact versions in `config/model.yaml`, never `"latest"`.
- This feature implements the application-layer rotation engine. In Foundrie's full deployed system, key rotation across 50+ keys/6 providers runs in the Rust execution layer and is reached over gRPC; document this boundary but implement the TypeScript engine and a key-selection seam here. When all providers are rate-limited, the engine must surface a recoverable "queued" state (NATS queue position in the deployed system) rather than a raw provider error.
- Prompts can carry planning-gate instructions (plan → approval → revision → execution) without bypassing the engine.
- Add tests for fallback selection, all-fail behavior, and tier-based primary selection.

## Out of Scope

- Discovery chat UI (Feature 10) and any generation feature.
- The Rust key rotation engine implementation itself (documented boundary only).
- Billing/Stripe enforcement of tiers (later billing feature).

## Future Modifications

- Feature 10+: Generation features call `callAI`/`callAIStream` with specific tasks.
- Later scale feature: NATS JetStream queuing and the Rust key engine replace the in-process key seam.

## Acceptance Criteria

- [ ] Provider adapters exist for Gemini, OpenRouter, Groq, DeepSeek (and Anthropic) implementing the shared interface.
- [ ] `callAI` and `callAIStream` resolve tasks to model keys and walk the fallback chain.
- [ ] Every attempt is logged with provider, model, task, success, error, and duration.
- [ ] Tier-based primary model selection works (FREE → DeepSeek R1, paid → Claude Sonnet 4).
- [ ] Model IDs are pinned in `config/model.yaml`; no `"latest"`.
- [ ] All-providers-exhausted returns a recoverable queued/error state, not a raw provider error.
- [ ] Tests cover fallback selection, all-fail behavior, and tier selection.
- [ ] No direct external AI calls exist outside `lib/ai/providers/`.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- All CodeRabbit reviews must pass. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
