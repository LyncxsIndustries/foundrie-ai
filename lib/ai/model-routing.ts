// Foundrie task map: resolves a logical AI task to a model key (the "AI firm"
// role). Mirrors architecture-context.md > Model Task Map exactly. The rotation
// engine maps task -> model key, then reads that key's fallback chain.

import type { Plan } from "./tier";
import { tierPrimaryModelKey } from "./fallback-chains";

/** Logical model-key roles. These are the keys used in `config/model.yaml`. */
export type ModelKey =
  | "claude-sonnet-4"
  | "gemini-2.5-pro"
  | "gemini-2.5-flash"
  | "deepseek-r1"
  | "deepseek-v3"
  | "qwen-coder"
  | "groq-llama"
  | "kimi-k2";

/** Every task Foundrie can dispatch through the rotation engine. */
export type AITask =
  // Discovery and planning -> gemini-2.5-pro
  | "discovery_interview"
  | "requirements_surfacing"
  | "architecture_proposal"
  | "non_functional_analysis"
  | "long_context_planning"
  // Reasoning and critique -> deepseek-r1
  | "trade_off_analysis"
  | "scalability_review"
  | "security_review"
  | "architecture_critique"
  | "infrastructure_decisions"
  | "hidden_requirement_detect"
  // Structured writing -> deepseek-v3
  | "feature_spec_generation"
  | "project_overview_md"
  | "architecture_context_md"
  | "agents_md_generation"
  | "api_contract_docs"
  | "rfc_generation"
  | "progress_tracker_md"
  | "ai_workflow_rules_md"
  // Code and implementation specs -> qwen-coder
  | "prisma_schema_gen"
  | "react_flow_node_gen"
  | "nextjs_route_gen"
  | "ui_component_specs"
  | "code_standards_md"
  | "typescript_patterns"
  // Fast conversation -> groq-llama
  | "chat_quick_reply"
  | "streaming_chat"
  | "diagram_label_suggestions"
  // Research and synthesis -> gemini-2.5-flash (or kimi-k2)
  | "tech_comparison"
  | "pattern_research"
  | "large_doc_analysis";

/**
 * Task -> model key. This is the canonical routing table; do not select models
 * per call site. Research tasks default to `gemini-2.5-flash`; callers needing
 * the long-context `kimi-k2` alternative pass an explicit override to `callAI`.
 */
export const TASK_MODEL_MAP: Record<AITask, ModelKey> = {
  // Discovery and planning
  discovery_interview: "gemini-2.5-pro",
  requirements_surfacing: "gemini-2.5-pro",
  architecture_proposal: "gemini-2.5-pro",
  non_functional_analysis: "gemini-2.5-pro",
  long_context_planning: "gemini-2.5-pro",
  // Reasoning and critique
  trade_off_analysis: "deepseek-r1",
  scalability_review: "deepseek-r1",
  security_review: "deepseek-r1",
  architecture_critique: "deepseek-r1",
  infrastructure_decisions: "deepseek-r1",
  hidden_requirement_detect: "deepseek-r1",
  // Structured writing
  feature_spec_generation: "deepseek-v3",
  project_overview_md: "deepseek-v3",
  architecture_context_md: "deepseek-v3",
  agents_md_generation: "deepseek-v3",
  api_contract_docs: "deepseek-v3",
  rfc_generation: "deepseek-v3",
  progress_tracker_md: "deepseek-v3",
  ai_workflow_rules_md: "deepseek-v3",
  // Code and implementation specs
  prisma_schema_gen: "qwen-coder",
  react_flow_node_gen: "qwen-coder",
  nextjs_route_gen: "qwen-coder",
  ui_component_specs: "qwen-coder",
  code_standards_md: "qwen-coder",
  typescript_patterns: "qwen-coder",
  // Fast conversation
  chat_quick_reply: "groq-llama",
  streaming_chat: "groq-llama",
  diagram_label_suggestions: "groq-llama",
  // Research and synthesis
  tech_comparison: "gemini-2.5-flash",
  pattern_research: "gemini-2.5-flash",
  large_doc_analysis: "gemini-2.5-flash",
};

/** Resolve a task to its default model key. */
export function modelKeyForTask(task: AITask): ModelKey {
  return TASK_MODEL_MAP[task];
}

/**
 * Resolve the effective model key for a task given the user's plan and an
 * optional explicit override.
 *
 * Precedence:
 *   1. `overrideModelKey` if provided (caller knows best, e.g. kimi-k2 for
 *      large-doc analysis).
 *   2. Tier primary for planning/architecture-grade tasks: paid tiers get
 *      `claude-sonnet-4`, free tier gets `deepseek-r1`. This is where tier
 *      drives model selection (Hard Rule 7) without hardcoding per endpoint.
 *   3. The task's default model key.
 *
 * Only "flagship" tasks (the discovery/planning group routed to
 * `gemini-2.5-pro`) are promoted to the tier primary. Fast-chat, code, and
 * research tasks keep their purpose-built model regardless of tier, because
 * routing a label suggestion to Claude wastes budget for no quality gain.
 *
 * The tier primary itself is sourced from `config/model.yaml` via
 * `tierPrimaryModelKey`, not hardcoded here, so the YAML stays the single
 * source of truth for tier->model selection.
 */
const FLAGSHIP_KEYS: ReadonlySet<ModelKey> = new Set(["gemini-2.5-pro"]);

export function resolveModelKey(
  task: AITask,
  plan: Plan,
  overrideModelKey?: ModelKey,
): ModelKey {
  if (overrideModelKey) return overrideModelKey;

  const taskKey = modelKeyForTask(task);
  if (FLAGSHIP_KEYS.has(taskKey)) {
    return tierPrimaryModelKey(plan);
  }
  return taskKey;
}
