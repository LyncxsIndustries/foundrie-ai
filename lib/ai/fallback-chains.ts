// Loads and validates the pinned model configuration from `config/model.yaml`.
//
// Fallback chains are CONFIGURATION, not ad-hoc try/catch in product code
// (code-standards.md > AI). This module parses the YAML once, validates it with
// Zod at the boundary, enforces the "no latest" pin rule, and exposes typed
// accessors the rotation engine uses to resolve a model key to an ordered list
// of { provider, model } attempts.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { load as parseYaml } from "js-yaml";
import { z } from "zod";
import type { ProviderId } from "./providers/types";
import type { ModelKey } from "./model-routing";
import type { Plan } from "./tier";

/** A single attempt in a fallback chain: a concrete provider + model id. */
export interface ChainEntry {
  provider: ProviderId;
  model: string;
}

const PROVIDER_IDS = [
  "anthropic",
  "gemini",
  "deepseek",
  "groq",
  "openrouter",
] as const;
const MODEL_KEYS = [
  "claude-sonnet-4",
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "deepseek-r1",
  "deepseek-v3",
  "qwen-coder",
  "groq-llama",
  "kimi-k2",
] as const;
const PLANS = ["FREE", "PRO", "ENTERPRISE"] as const;

const chainEntrySchema = z.object({
  provider: z.enum(PROVIDER_IDS),
  // Reject the "latest" alias outright: model ids must be pinned exact versions
  // (AGENTS.md Hard Rule 5). The refine guards against any id containing
  // "latest" as a whole token (e.g. "gemini-flash-latest").
  model: z
    .string()
    .min(1)
    .refine((m) => !/(^|[-/:])latest($|[-/:])/i.test(m), {
      message: 'model id must be pinned to an exact version, never "latest"',
    }),
});

const modelConfigSchema = z.object({
  version: z.literal(1),
  tier_primary: z.record(z.enum(PLANS), z.enum(MODEL_KEYS)),
  models: z.record(z.string(), z.string()),
  production_primary_chain: z.array(chainEntrySchema).min(1),
  chains: z.record(z.enum(MODEL_KEYS), z.array(chainEntrySchema).min(1)),
});

export type ModelConfig = z.infer<typeof modelConfigSchema>;

let cached: ModelConfig | undefined;

/** Absolute path to the pinned config, relative to the repo root at runtime. */
function configPath(): string {
  return join(process.cwd(), "config", "model.yaml");
}

/**
 * Load, parse, and validate `config/model.yaml`. Cached after first load.
 * Throws if the file is missing, malformed, or contains a non-pinned model id —
 * a misconfigured rotation engine must fail loudly at startup, not silently
 * route to a wrong model.
 */
export function loadModelConfig(): ModelConfig {
  if (cached) return cached;

  const raw = readFileSync(configPath(), "utf8");
  const parsed = parseYaml(raw);
  cached = modelConfigSchema.parse(parsed);
  return cached;
}

/** Test seam: reset the memoized config (used by unit tests). */
export function resetModelConfigCache(): void {
  cached = undefined;
}

/** Resolve a model key to its ordered fallback chain. */
export function getFallbackChain(modelKey: ModelKey): ChainEntry[] {
  const config = loadModelConfig();
  const chain = config.chains[modelKey];
  if (!chain) {
    throw new Error(`No fallback chain configured for model key "${modelKey}"`);
  }
  return chain;
}

/** Resolve the tier-derived primary model key from the config. */
export function tierPrimaryModelKey(plan: Plan): ModelKey {
  const config = loadModelConfig();
  const key = config.tier_primary[plan];
  if (!key) {
    throw new Error(`No tier_primary model key configured for plan "${plan}"`);
  }
  return key;
}
