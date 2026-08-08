# Discovery Chat Hybrid Architecture - Implementation Summary

**Date:** 2026-08-08  
**Status:** Architecture Designed, Specs in Progress  
**Critical Issue:** Discovery chat loops indefinitely, no memory, repeats questions

---

## What Was Fixed

### ❌ Before (Broken)
- AI repeats questions already answered
- No memory of conversation history
- No phase completion logic
- LLM doing everything (chat + DB + state)
- Don't know which models work
- Discovery never completes

### ✅ After (Fixed)
- **ChromaDB semantic memory** prevents question repetition
- **Structured question tracking** with completion criteria
- **Tool separation**: Chat (LLM) vs Tools (DB mutations)
- **Hybrid architecture**: Trigger.dev + Custom Rotation Engine
- **Model testing suite** validates all providers
- **Automated phase advancement** when criteria met

---

## New Architecture: 5 Feature Specs (113-117)

### Feature 113 - Discovery Chat Memory & RAG Integration
**What:** ChromaDB vector store for semantic memory

**Solves:**
- ✅ Remembers all previous answers
- ✅ Searches conversation history for similar questions
- ✅ Prevents asking same question twice
- ✅ Context-aware responses

**Key Files:**
- `lib/memory/chromadb.ts` - Vector store integration
- `lib/memory/semantic-search.ts` - Similarity search
- `lib/memory/context-injection.ts` - Inject context into prompts

### Feature 114 - Structured Phase Completion System
**What:** Question list management with automated completion

**Solves:**
- ✅ AI generates question list at phase start
- ✅ Tracks which questions are answered
- ✅ Dynamically adds/removes questions based on answers
- ✅ Auto-advances phase when all required questions answered

**Key Files:**
- `lib/discovery/question-manager.ts` - Question CRUD
- `lib/discovery/completion-checker.ts` - Phase readiness logic
- `lib/discovery/question-generator.ts` - AI-powered question generation

### Feature 115 - Chat vs Tool Separation (Harness)
**What:** LLM only does chat, tools handle state mutations

**Solves:**
- ✅ Clear separation of concerns
- ✅ LLM doesn't directly update DB
- ✅ Tools handle phase advancement
- ✅ Tools track question state
- ✅ Tools validate completion

**Key Files:**
- `lib/discovery/tools/chat-tool.ts` - LLM responses only
- `lib/discovery/tools/state-tool.ts` - DB mutations
- `lib/discovery/tools/completion-tool.ts` - Phase checks
- `lib/discovery/tools/question-tool.ts` - Question mutations

### Feature 116 - Model Testing & Validation Suite
**What:** Test all AI providers, validate fallback chains

**Solves:**
- ✅ Know which models work
- ✅ Test fallback chains
- ✅ Monitor model availability
- ✅ Track cost per model
- ✅ Validate API keys

**Providers to Test:**
- ✅ Gemini (have key)
- ✅ OpenRouter (have key)
- ✅ Groq (have key)
- ✅ DeepSeek (have key)
- ✅ Kimi K2 (have key)
- ✅ Qwen (have key)
- ⏳ Anthropic Claude (will buy before launch)

**Key Files:**
- `lib/ai/test-suite/provider-tests.ts` - Test all providers
- `lib/ai/test-suite/fallback-tests.ts` - Test chains
- `lib/ai/test-suite/cost-tracking.ts` - Track usage

### Feature 117 - Discovery Chat Trigger.dev Migration
**What:** Hybrid Trigger.dev + Custom Rotation Engine

**Solves:**
- ✅ Conversations survive page refresh
- ✅ Session recovery from crashes
- ✅ No API routes needed
- ✅ Tool execution with HITL
- ✅ Custom rotation engine intelligence
- ✅ Lifecycle hooks for state management

**Replaces:**
- ❌ `app/api/conversations/[projectId]/chat/route.ts` (delete)

**Adds:**
- ✅ `trigger/discovery-chat.ts` (new)

---

## The Working Flow (Simplified)

```
1. User starts discovery
   ↓
2. Tool: Generate question list for Phase 1
   ↓
3. Tool: Store questions in DB + ChromaDB
   ↓
4. User sends message
   ↓
5. Tool: Search semantic memory for similar past answers
   ↓
6. Custom Rotation Engine: Select best model (tier-aware)
   ↓
7. LLM: Generate response with context
   ↓
8. Trigger.dev: Stream to frontend
   ↓
9. Tool: Store response in semantic memory
   ↓
10. Tool: Check which questions are now answered
    ↓
11. Tool: If all required questions answered → advance phase
    ↓
12. Repeat steps 4-11 until discovery complete
```

---

## Installation Requirements

### New Dependencies

```bash
# ChromaDB for semantic memory
npm install chromadb

# Already have (verify versions)
npm list @trigger.dev/sdk  # Should be v4.4.6+
npm list @trigger.dev/react-hooks
```

### Environment Variables

```bash
# Add to .env
CHROMA_URL=http://localhost:8000  # Local ChromaDB instance
CHROMA_API_KEY=<optional>

# Already have these
GEMINI_API_KEY=***
OPENROUTER_API_KEY=***
GROQ_API_KEY=***
DEEPSEEK_API_KEY=***
# Will add before launch:
# ANTHROPIC_API_KEY=***
```

### ChromaDB Setup

```bash
# Run ChromaDB locally
docker run -p 8000:8000 chromadb/chroma

# Or install as Python package
pip install chromadb
chroma run --path ./chroma_data
```

---

## Next Steps (Priority Order)

1. ✅ **Create Feature 113-117 specs** (in progress)
2. **Install ChromaDB** and test connection
3. **Run model validation** (Feature 116) - test all API keys
4. **Implement semantic memory** (Feature 113)
5. **Implement question manager** (Feature 114)
6. **Implement tool harness** (Feature 115)
7. **Migrate to Trigger.dev** (Feature 117)
8. **Test discovery flow end-to-end**

---

## Success Criteria

After implementing Features 113-117:

- [ ] Discovery never repeats questions
- [ ] AI knows what information was already provided
- [ ] Phase completes automatically when criteria met
- [ ] Conversation survives page refresh
- [ ] All 6 models tested and validated
- [ ] Fallback chains work correctly
- [ ] Discovery completes in reasonable time (5-30 messages depending on complexity)
- [ ] User can see progress: "Question 3 of 7 answered"

---

## Documentation Created

1. `research/DISCOVERY_CHAT_ISSUES_ANALYSIS.md` - Root cause analysis
2. `research/AI_ROUTING_ARCHITECTURE_ANALYSIS.md` - Hybrid approach explanation
3. `project-kit/POSTHOG_TRIGGER_INSTRUMENTATION_PLAN.md` - Analytics plan
4. This summary document

---

**Status: Architecture designed, ready for feature spec creation and implementation.**
