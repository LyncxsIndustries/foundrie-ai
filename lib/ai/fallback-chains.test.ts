import { describe, expect, it, beforeEach } from "vitest";
import {
  getFallbackChain,
  loadModelConfig,
  resetModelConfigCache,
  tierPrimaryModelKey,
} from "./fallback-chains";
import type { ModelKey } from "./model-routing";

const ALL_MODEL_KEYS: ModelKey[] = [
  "claude-sonnet-4",
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "deepseek-r1",
  "deepseek-v3",
  "qwen-coder",
  "groq-llama",
  "kimi-k2",
];

describe("model.yaml configuration", () => {
  beforeEach(() => resetModelConfigCache());

  it("loads and validates the pinned config", () => {
    const config = loadModelConfig();
    expect(config.version).toBe(1);
    expect(config.production_primary_chain.length).toBeGreaterThan(0);
  });

  it("defines a non-empty fallback chain for every model key", () => {
    for (const key of ALL_MODEL_KEYS) {
      const chain = getFallbackChain(key);
      expect(chain.length).toBeGreaterThan(0);
      for (const entry of chain) {
        expect(entry.provider).toBeTruthy();
        expect(entry.model.length).toBeGreaterThan(0);
      }
    }
  });

  it('pins every model id - no chain entry uses "latest"', () => {
    const config = loadModelConfig();
    const allEntries = [
      ...config.production_primary_chain,
      ...Object.values(config.chains).flat(),
    ];
    for (const entry of allEntries) {
      expect(entry.model).not.toMatch(/(^|[-/:])latest($|[-/:])/i);
    }
  });

  it("derives the tier primary model key from config", () => {
    expect(tierPrimaryModelKey("FREE")).toBe("deepseek-r1");
    expect(tierPrimaryModelKey("PRO")).toBe("claude-sonnet-4");
    expect(tierPrimaryModelKey("ENTERPRISE")).toBe("claude-sonnet-4");
  });

  it("starts the production primary chain with Claude Sonnet 4", () => {
    const config = loadModelConfig();
    expect(config.production_primary_chain[0].provider).toBe("anthropic");
    expect(config.production_primary_chain[0].model).toMatch(
      /^claude-sonnet-4/,
    );
  });
});
