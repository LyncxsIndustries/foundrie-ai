// Public surface of the AI rotation engine. Product code imports `callAI` /
// `callAIStream` and the task/plan types from here; it must never import a
// provider adapter directly.

export {
  callAI,
  callAIStream,
  type CallOptions,
  type CallResult,
  type CallSuccess,
  type CallQueued,
  type StreamResult,
  type StreamSuccess,
} from "./rotation-engine";
export {
  type AITask,
  type ModelKey,
  resolveModelKey,
  modelKeyForTask,
} from "./model-routing";
export { type Plan, isPaidPlan } from "./tier";
export {
  buildSystemPrompt,
  PLANNING_GATE_CLAUSE,
  FOUNDRIE_BASE_PERSONA,
} from "./prompts/system";
