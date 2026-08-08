# Architecture Documentation

This directory contains comprehensive architectural documentation for Foundrie AI.

## Contents

### Discovery Chat Architecture

**DISCOVERY_CHAT_HYBRID_ARCHITECTURE_SUMMARY.md**
- Complete solution for discovery chat infinite loop problem
- Hybrid Trigger.dev + Custom Rotation Engine architecture
- ChromaDB semantic memory integration
- Structured phase completion system
- Chat vs tool separation (harness)
- Model testing & validation suite
- Implementation roadmap for Features 113-117

**DISCOVERY_CHAT_ISSUES_ANALYSIS.md** (in ../research/)
- Root cause analysis of discovery chat issues
- Detailed problem breakdown
- Solution architecture overview

### Instrumentation & Analytics

**POSTHOG_TRIGGER_INSTRUMENTATION_PLAN.md**
- Complete PostHog event tracking plan
- Covers 6 dashboards: Growth, Engagement, Product Usage, Revenue, Technical Health, Churn
- Event taxonomy with 30+ events
- Implementation guide for Features 106-112
- Trigger.dev task monitoring patterns
- API error tracking strategy

### Spec Organization

**SPEC_REORGANIZATION_2026-08-08.md**
- Documents the shift from 99 to 117 specs
- New specs 65-70: Discovery Orchestration
- New specs 106-112: PostHog & Trigger.dev instrumentation
- Renamed specs 65-99 → 71-105
- Complete cross-reference updates
- Database schema changes
- API route additions

## Related Documentation

### In ../research/
- `AI_ROUTING_ARCHITECTURE_ANALYSIS.md` - Custom rotation vs Trigger.dev comparison
- `DISCOVERY_CHAT_ISSUES_ANALYSIS.md` - Problem analysis
- `FOUNDRIE_RESEARCH.md` - Master research document
- `FOUNDRIE_V*.md` - Version-specific research

### In ../project-kit/
- `context/` - Active product context (6 files)
- `feature-specs/` - All 117 feature specifications

### Root Files
- `AGENTS.md` - Agent workflow and hard rules
- `ARTKINS_STYLE_GUIDE.md` - Engineering policy
- `README.md` - Project overview

## Architecture Evolution

1. **Phase 1** (Specs 01-64): Core foundation
2. **Phase 2** (Specs 65-70): Discovery orchestration layer
3. **Phase 3** (Specs 71-105): UI refinements and production readiness
4. **Phase 4** (Specs 106-112): Instrumentation
5. **Phase 5** (Specs 113-117): Memory, RAG, and hybrid architecture

## Key Architectural Decisions

### Hybrid AI Architecture
- **Trigger.dev**: Provides durability, streaming, lifecycle hooks, tool approvals
- **Custom Rotation Engine**: Provides task-specific routing, tier-aware selection, multi-provider fallback
- **ChromaDB**: Provides semantic memory and prevents question repetition

### Separation of Concerns
- **Chat (LLM)**: Generates responses only
- **Tools (DB)**: Handles state mutations, phase advancement, question tracking
- **Harness**: Orchestrates tool execution with validation

### Multi-Provider Strategy
- Gemini 2.5 Pro (synthesis, long-context)
- DeepSeek R1 (critique, reasoning)
- DeepSeek V3 (technical writing)
- Qwen Coder (code-oriented specs)
- Groq Llama (fast chat, labeling)
- Claude Sonnet 4 (premium tier, will purchase before launch)

## Implementation Priority

1. ✅ Foundation (Specs 01-64) - COMPLETE
2. 📋 Discovery Orchestration (Specs 65-70) - NEXT
3. 📋 Instrumentation (Specs 106-112) - HIGH PRIORITY
4. 📋 Memory & RAG (Specs 113-117) - CRITICAL
5. 📋 UI & Production (Specs 71-105) - ONGOING

## Contact

For questions about architecture decisions, see:
- `AGENTS.md` for agent workflow
- `project-kit/context/architecture-context.md` for stack details
- `research/FOUNDRIE_RESEARCH.md` for product research
