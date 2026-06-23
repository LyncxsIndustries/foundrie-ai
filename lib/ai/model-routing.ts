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
  | "kimi-k2"
  | "unified-rotation";

/** Every task Foundrie can dispatch through the rotation engine. */
export type AITask =
  // Discovery and planning -> unified-rotation
  | "discovery_interview"
  | "requirements_surfacing"
  | "architecture_proposal"
  | "non_functional_analysis"
  | "long_context_planning"
  // Reasoning and critique -> unified-rotation
  | "trade_off_analysis"
  | "scalability_review"
  | "security_review"
  | "architecture_critique"
  | "infrastructure_decisions"
  | "hidden_requirement_detect"
  // Structured writing -> unified-rotation
  | "feature_spec_generation"
  | "project_overview_md"
  | "architecture_context_md"
  | "ui_context_md"
  | "agents_md_generation"
  | "api_contract_docs"
  | "rfc_generation"
  | "progress_tracker_md"
  | "ai_workflow_rules_md"
  | "requirements_export_discovery_md"
  | "requirements_export_analysis_md"
  | "requirements_export_adr_md"
  // Project management docs -> unified-rotation (Feature 48)
  | "pm_scope_md"
  | "pm_timeline_md"
  | "pm_pricing_md"
  | "pm_changelog_md"
  // Code and implementation specs -> unified-rotation
  | "prisma_schema_gen"
  | "react_flow_node_gen"
  | "nextjs_route_gen"
  | "ui_component_specs"
  | "code_standards_md"
  | "typescript_patterns"
  // Fast conversation -> unified-rotation
  | "chat_quick_reply"
  | "streaming_chat"
  | "diagram_label_suggestions"
  // Research and synthesis -> unified-rotation
  | "tech_comparison"
  | "pattern_research"
  | "large_doc_analysis"
  // Visual and motion analysis -> unified-rotation
  | "visual_asset_analysis"
  | "motion_analysis"
  // Research synthesis -> unified-rotation
  | "research_synthesis"
  // Diagram planning -> unified-rotation
  | "diagram_planning"
  // Diagram generation -> unified-rotation
  | "diagram_generation"
  // Feature specs generation -> unified-rotation
  | "feature_specs_generation";

/**
 * Task -> model key. This is the canonical routing table; do not select models
 * per call site. All tasks now point to a unified model rotation chain.
 */
export const TASK_MODEL_MAP: Record<AITask, ModelKey> = {
  // Discovery and planning
  discovery_interview: "unified-rotation",
  requirements_surfacing: "unified-rotation",
  architecture_proposal: "unified-rotation",
  non_functional_analysis: "unified-rotation",
  long_context_planning: "unified-rotation",
  // Reasoning and critique
  trade_off_analysis: "unified-rotation",
  scalability_review: "unified-rotation",
  security_review: "unified-rotation",
  architecture_critique: "unified-rotation",
  infrastructure_decisions: "unified-rotation",
  hidden_requirement_detect: "unified-rotation",
  // Structured writing
  feature_spec_generation: "unified-rotation",
  project_overview_md: "unified-rotation",
  architecture_context_md: "unified-rotation",
  ui_context_md: "unified-rotation",
  agents_md_generation: "unified-rotation",
  api_contract_docs: "unified-rotation",
  rfc_generation: "unified-rotation",
  progress_tracker_md: "unified-rotation",
  ai_workflow_rules_md: "unified-rotation",
  requirements_export_discovery_md: "unified-rotation",
  requirements_export_analysis_md: "unified-rotation",
  requirements_export_adr_md: "unified-rotation",
  // Project management docs (Feature 48)
  pm_scope_md: "unified-rotation",
  pm_timeline_md: "unified-rotation",
  pm_pricing_md: "unified-rotation",
  pm_changelog_md: "unified-rotation",
  // Code and implementation specs
  prisma_schema_gen: "unified-rotation",
  react_flow_node_gen: "unified-rotation",
  nextjs_route_gen: "unified-rotation",
  ui_component_specs: "unified-rotation",
  code_standards_md: "unified-rotation",
  typescript_patterns: "unified-rotation",
  // Fast conversation
  chat_quick_reply: "unified-rotation",
  streaming_chat: "unified-rotation",
  diagram_label_suggestions: "unified-rotation",
  // Research and synthesis
  tech_comparison: "unified-rotation",
  pattern_research: "unified-rotation",
  large_doc_analysis: "unified-rotation",
  // Visual and motion analysis (Feature 08)
  visual_asset_analysis: "unified-rotation",
  motion_analysis: "unified-rotation",
  // Research synthesis (Feature 09)
  research_synthesis: "unified-rotation",
  // Diagram planning (Feature 18)
  diagram_planning: "unified-rotation",
  // Diagram generation (Feature 19)
  diagram_generation: "unified-rotation",
  // Feature specs generation (Feature 26)
  feature_specs_generation: "unified-rotation",
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

  // Per user request, ALL tasks now use model rotation across the best models
  // to avoid hitting rate limits on specialized purpose-built models.
  // The tier primary (which maps to a massive cross-provider fallback chain)
  // is now used for all tasks, overriding the specialized TASK_MODEL_MAP.
  return tierPrimaryModelKey(plan);
}
