import { describe, expect, it } from "vitest";
import {
  TASK_MODEL_MAP,
  modelKeyForTask,
  resolveModelKey,
  type AITask,
} from "./model-routing";

describe("model-routing task map", () => {
  it("routes each task group to its documented model key", () => {
    expect(modelKeyForTask("discovery_interview")).toBe("gemini-2.5-pro");
    expect(modelKeyForTask("architecture_proposal")).toBe("gemini-2.5-pro");
    expect(modelKeyForTask("security_review")).toBe("deepseek-r1");
    expect(modelKeyForTask("feature_spec_generation")).toBe("deepseek-v3");
    expect(modelKeyForTask("nextjs_route_gen")).toBe("qwen-coder");
    expect(modelKeyForTask("chat_quick_reply")).toBe("groq-llama");
    expect(modelKeyForTask("tech_comparison")).toBe("gemini-2.5-flash");
  });

  it("maps every declared task to a model key", () => {
    const tasks = Object.keys(TASK_MODEL_MAP) as AITask[];
    expect(tasks.length).toBeGreaterThan(0);
    for (const task of tasks) {
      expect(TASK_MODEL_MAP[task]).toBeTruthy();
    }
  });
});

describe("resolveModelKey tier-based primary selection", () => {
  it("promotes flagship planning tasks to deepseek-r1 for FREE plan", () => {
    expect(resolveModelKey("architecture_proposal", "FREE")).toBe(
      "deepseek-r1",
    );
    expect(resolveModelKey("discovery_interview", "FREE")).toBe("deepseek-r1");
  });

  it("promotes flagship planning tasks to claude-sonnet-4 for paid plans", () => {
    expect(resolveModelKey("architecture_proposal", "PRO")).toBe(
      "claude-sonnet-4",
    );
    expect(resolveModelKey("discovery_interview", "ENTERPRISE")).toBe(
      "claude-sonnet-4",
    );
  });

  it("keeps non-flagship tasks on their purpose-built model regardless of tier", () => {
    expect(resolveModelKey("chat_quick_reply", "FREE")).toBe("groq-llama");
    expect(resolveModelKey("chat_quick_reply", "ENTERPRISE")).toBe(
      "groq-llama",
    );
    expect(resolveModelKey("nextjs_route_gen", "PRO")).toBe("qwen-coder");
    expect(resolveModelKey("security_review", "ENTERPRISE")).toBe(
      "deepseek-r1",
    );
  });

  it("honours an explicit override above tier and task defaults", () => {
    expect(resolveModelKey("large_doc_analysis", "PRO", "kimi-k2")).toBe(
      "kimi-k2",
    );
    expect(
      resolveModelKey("architecture_proposal", "FREE", "gemini-2.5-pro"),
    ).toBe("gemini-2.5-pro");
  });
});
