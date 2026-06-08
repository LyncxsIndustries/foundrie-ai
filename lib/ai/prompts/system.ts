// Shared system-message / prompt utilities for the rotation engine.
//
// Prompts can carry planning-gate instructions (plan -> approval -> revision ->
// execution) without bypassing the engine: every generation still calls
// `callAI`/`callAIStream`. This module builds reusable system-message preambles
// so generation features (Feature 10+) compose consistent prompts rather than
// re-stating the gate inline. Keeping prompts here (lib/ai/prompts) is required
// by code-standards.md > AI.

/**
 * The planning-gate clause appended to system prompts for any task that
 * produces implementation-impacting output (architecture, diagrams, context
 * files, specs, ZIP packaging). It instructs the model to present a plan and
 * wait for approval before emitting final artifacts.
 */
export const PLANNING_GATE_CLAUSE = [
  "Follow the planning gate: when the requested work would impact implementation",
  "(architecture, diagrams, context files, feature specs, or packaging), first",
  "present a concrete plan and wait for explicit approval. Revise the plan on",
  "request before producing final output. Do not jump from a vague goal to a",
  "finished artifact.",
].join(" ");

/** Foundrie's baseline persona shared across structured-output tasks. */
export const FOUNDRIE_BASE_PERSONA = [
  "You are an expert software architect operating inside Foundrie AI, a pre-IDE",
  "architectural workspace. You own what and why, never how and when. Every",
  "recommendation cites a source. Be precise, avoid marketing language, and",
  "never invent product behavior that is not documented.",
].join(" ");

export interface BuildSystemPromptOptions {
  /** The role/task-specific instructions. */
  instructions: string;
  /** Prepend the shared Foundrie persona. Defaults to true. */
  includePersona?: boolean;
  /** Append the planning-gate clause. Defaults to false. */
  includePlanningGate?: boolean;
}

/**
 * Compose a system prompt from optional persona, task instructions, and the
 * planning-gate clause. Returns a single trimmed string suitable for an
 * adapter's `systemPrompt`.
 */
export function buildSystemPrompt(options: BuildSystemPromptOptions): string {
  const parts: string[] = [];
  if (options.includePersona ?? true) parts.push(FOUNDRIE_BASE_PERSONA);
  parts.push(options.instructions.trim());
  if (options.includePlanningGate) parts.push(PLANNING_GATE_CLAUSE);
  return parts.filter((p) => p.length > 0).join("\n\n");
}
