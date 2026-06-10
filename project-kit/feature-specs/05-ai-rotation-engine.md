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

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract (schema fields or relations, route signatures, helper signatures, AI task names or callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, or file ownership), update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch. Do not leave future specs with stale names, old API shapes, or invalid fields.


- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens) is also baked into the generated projects, ensuring they are premium products.

### AI Provider API Key Setup Instructions

This feature requires API keys from multiple AI providers. Here's how to obtain each one:

1. **Anthropic (Claude)** - https://console.anthropic.com
   - Create account at https://console.anthropic.com
   - Navigate to "API Keys" in the dashboard
   - Click "Create Key"
   - Copy the key (starts with `sk-ant-`)
   - Set as `ANTHROPIC_API_KEY` in `.env.local`
   - Note: While optional, this is highly recommended for PRO/ENTERPRISE tiers

2. **Google Gemini** - https://aistudio.google.com/apikey
   - Sign in with Google account at https://aistudio.google.com
   - Click "Get API key" button
   - Create API key for your project
   - Copy the key (starts with `AIza`)
   - Set as `GEMINI_API_KEY` in `.env.local`

3. **DeepSeek** - https://platform.deepseek.com
   - Create account at https://platform.deepseek.com
   - Navigate to API Keys section
   - Click "Create API Key"
   - Copy the key (starts with `sk-`)
   - Set as `DEEPSEEK_API_KEY` in `.env.local`

4. **Groq** - https://console.groq.com/keys
   - Create account at https://console.groq.com
   - Navigate to "API Keys"
   - Click "Create API Key"
   - Name your key and copy it (starts with `gsk_`)
   - Set as `GROQ_API_KEY` in `.env.local`

5. **OpenRouter** - https://openrouter.ai/keys
   - Create account at https://openrouter.ai
   - Navigate to "Keys" in dashboard
   - Click "Create Key"
   - Copy the key (starts with `sk-or-`)
   - Set as `OPENROUTER_API_KEY` in `.env.local`

6. **Nvidia NIM** - https://build.nvidia.com/explore/discover
   - Create account at https://build.nvidia.com
   - Navigate to any model page (e.g., Llama 3.1)
   - Click "Get API Key" button in the top right
   - Generate new API key
   - Copy the key (starts with `nvapi-`)
   - Set as `NVIDIA_API_KEY` in `.env.local`
   - Note: Free tier available with rate limits

**Important Notes:**
- The rotation engine gracefully degrades when providers are unavailable (no API key)
- At minimum, configure Gemini and DeepSeek for a fully functional free-tier setup
- All providers have free tiers with rate limits; the rotation engine automatically falls back when limits are hit
- Copy `.env.example` to `.env.local` and fill in your keys
- Never commit `.env.local` to version control

### Unified Model Rotation Architecture

**CRITICAL CHANGE (v2.0)**: The AI rotation engine now uses a **unified rotation strategy** across all tasks to prevent rate limit exhaustion on specialized providers.

**Previous Architecture (Deprecated):**
- Each AI task was assigned to a specialized model (e.g., `streaming_chat` → `groq-llama`, `requirements_surfacing` → `gemini-2.5-pro`)
- When a specialized model hit rate limits, the task would fail even though other providers were available
- This caused "Error: Could not fetch response" after ~6 messages in discovery chat

**New Architecture (Current):**
- ALL tasks now use a single `unified-rotation` chain that cycles through the best model from each provider
- Unified rotation chain order: Anthropic Claude Sonnet 4 → Google Gemini Pro → DeepSeek R1 → Nvidia Llama 405B → Groq Llama 70B → OpenRouter Qwen Coder
- When any provider hits a rate limit, the engine automatically falls back to the next provider in the chain
- This ensures Foundrie never exhausts all providers for any single task
- The tier-based primary model selection still applies (FREE → DeepSeek R1 primary, PRO/ENTERPRISE → Claude Sonnet 4 primary)

**Why This Change:**
- Prevents rate limit errors in user-facing features like discovery chat
- Distributes load across all available providers instead of hammering specialized ones
- Maximizes availability and resilience of the entire system
- Preserves quality by prioritizing premium models (Claude, Gemini) while having robust fallbacks

**Implementation Details:**
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
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
