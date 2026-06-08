import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  AICallParams,
  AIProvider,
  AIResponse,
  ProviderId,
} from "./providers/types";
import { ProviderCallError } from "./providers/types";

// Mock the provider registry so the engine resolves to controllable fakes
// instead of real adapters. getFallbackChain still reads the real model.yaml,
// so these tests also exercise real chain resolution.
const mockGetProvider = vi.fn<(id: ProviderId) => AIProvider>();
vi.mock("./providers", () => ({
  getProvider: (id: ProviderId) => mockGetProvider(id),
}));

// Silence structured log output during tests.
vi.mock("./log", () => ({ logEvent: vi.fn() }));

import { callAI, callAIStream } from "./rotation-engine";

interface FakeBehaviour {
  available?: boolean;
  /** "ok" returns text; "ratelimit"/"error" throw; default "ok". */
  mode?: "ok" | "ratelimit" | "error";
  text?: string;
}

function makeProvider(id: ProviderId, behaviour: FakeBehaviour): AIProvider {
  const available = behaviour.available ?? true;
  const mode = behaviour.mode ?? "ok";
  return {
    name: id,
    isAvailable: vi.fn(async () => available),
    call: vi.fn(async (params: AICallParams): Promise<AIResponse> => {
      if (mode === "ratelimit") {
        throw new ProviderCallError("rate limited", {
          provider: id,
          model: params.model,
          status: 429,
        });
      }
      if (mode === "error") {
        throw new ProviderCallError("boom", {
          provider: id,
          model: params.model,
          status: 500,
        });
      }
      return {
        text: behaviour.text ?? `response from ${id}`,
        model: params.model,
        provider: id,
      };
    }),
    callStream: vi.fn(async function* (params: AICallParams) {
      if (mode === "ratelimit") {
        throw new ProviderCallError("rate limited", {
          provider: id,
          model: params.model,
          status: 429,
        });
      }
      if (mode === "error") {
        throw new ProviderCallError("boom", {
          provider: id,
          model: params.model,
          status: 500,
        });
      }
      yield behaviour.text ?? `chunk from ${id}`;
    }),
  };
}

/** Configure the registry mock from a map of provider id -> behaviour. */
function registry(map: Partial<Record<ProviderId, FakeBehaviour>>): void {
  mockGetProvider.mockImplementation((id: ProviderId) =>
    makeProvider(id, map[id] ?? { available: false }),
  );
}

beforeEach(() => {
  mockGetProvider.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("callAI fallback selection", () => {
  it("returns the first available provider's response", async () => {
    // architecture_proposal + PRO -> claude-sonnet-4 chain, head = anthropic.
    registry({ anthropic: { mode: "ok", text: "from claude" } });

    const result = await callAI("architecture_proposal", {
      systemPrompt: "s",
      userPrompt: "u",
      plan: "PRO",
    });

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.provider).toBe("anthropic");
      expect(result.text).toBe("from claude");
      expect(result.attempts).toBe(1);
      expect(result.modelKey).toBe("claude-sonnet-4");
    }
  });

  it("walks past a rate-limited primary to the next provider", async () => {
    // claude-sonnet-4 chain: anthropic -> gemini -> deepseek -> openrouter...
    registry({
      anthropic: { mode: "ratelimit" },
      gemini: { mode: "ok", text: "from gemini" },
    });

    const result = await callAI("architecture_proposal", {
      systemPrompt: "s",
      userPrompt: "u",
      plan: "PRO",
    });

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.provider).toBe("gemini");
      expect(result.attempts).toBe(2);
    }
  });

  it("skips unavailable providers without counting them as attempts", async () => {
    registry({
      anthropic: { available: false },
      gemini: { mode: "ok", text: "from gemini" },
    });

    const result = await callAI("architecture_proposal", {
      systemPrompt: "s",
      userPrompt: "u",
      plan: "PRO",
    });

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.provider).toBe("gemini");
      // anthropic was skipped (unavailable), so only the gemini call counts.
      expect(result.attempts).toBe(1);
    }
  });
});

describe("callAI tier-based primary selection", () => {
  it("FREE plan routes a flagship task to the deepseek-r1 chain", async () => {
    // deepseek-r1 chain head = deepseek provider.
    registry({ deepseek: { mode: "ok", text: "r1" } });

    const result = await callAI("discovery_interview", {
      systemPrompt: "s",
      userPrompt: "u",
      plan: "FREE",
    });

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.modelKey).toBe("deepseek-r1");
      expect(result.provider).toBe("deepseek");
    }
  });

  it("paid plan routes a flagship task to the claude-sonnet-4 chain", async () => {
    registry({ anthropic: { mode: "ok", text: "sonnet" } });

    const result = await callAI("discovery_interview", {
      systemPrompt: "s",
      userPrompt: "u",
      plan: "ENTERPRISE",
    });

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.modelKey).toBe("claude-sonnet-4");
      expect(result.provider).toBe("anthropic");
    }
  });
});

describe("callAI all-fail behavior", () => {
  it("returns a recoverable queued state when no provider is available", async () => {
    registry({}); // every provider unavailable

    const result = await callAI("architecture_proposal", {
      systemPrompt: "s",
      userPrompt: "u",
      plan: "PRO",
    });

    expect(result.status).toBe("queued");
    if (result.status === "queued") {
      expect(result.retryable).toBe(true);
      expect(result.attempts).toBe(0);
      expect(result.position).toBeNull();
    }
  });

  it("returns queued with rateLimited=true when every provider is rate-limited", async () => {
    registry({
      anthropic: { mode: "ratelimit" },
      gemini: { mode: "ratelimit" },
      deepseek: { mode: "ratelimit" },
      openrouter: { mode: "ratelimit" },
      groq: { mode: "ratelimit" },
    });

    const result = await callAI("architecture_proposal", {
      systemPrompt: "s",
      userPrompt: "u",
      plan: "PRO",
    });

    expect(result.status).toBe("queued");
    if (result.status === "queued") {
      expect(result.rateLimited).toBe(true);
      expect(result.attempts).toBeGreaterThan(0);
      expect(result.lastError).toBeTruthy();
    }
  });

  it("does not throw a raw provider error on exhaustion", async () => {
    registry({ anthropic: { mode: "error" }, gemini: { mode: "error" } });

    await expect(
      callAI("architecture_proposal", {
        systemPrompt: "s",
        userPrompt: "u",
        plan: "PRO",
      }),
    ).resolves.toMatchObject({ status: "queued" });
  });
});

describe("callAIStream", () => {
  it("streams text deltas from the first available provider", async () => {
    registry({ anthropic: { mode: "ok", text: "hello stream" } });

    const result = await callAIStream("architecture_proposal", {
      systemPrompt: "s",
      userPrompt: "u",
      plan: "PRO",
    });

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      const chunks: string[] = [];
      for await (const chunk of result.stream) chunks.push(chunk);
      expect(chunks.join("")).toBe("hello stream");
      expect(result.provider).toBe("anthropic");
    }
  });

  it("falls back when opening the primary stream fails", async () => {
    registry({
      anthropic: { mode: "error" },
      gemini: { mode: "ok", text: "gemini stream" },
    });

    const result = await callAIStream("architecture_proposal", {
      systemPrompt: "s",
      userPrompt: "u",
      plan: "PRO",
    });

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.provider).toBe("gemini");
    }
  });

  it("returns queued when no provider can serve a stream", async () => {
    registry({});

    const result = await callAIStream("architecture_proposal", {
      systemPrompt: "s",
      userPrompt: "u",
      plan: "PRO",
    });

    expect(result.status).toBe("queued");
  });
});
