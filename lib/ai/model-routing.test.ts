import { describe, expect, it } from "vitest";
import {
  TASK_MODEL_MAP,
  modelKeyForTask,
  resolveModelKey,
  type AITask,
} from "./model-routing";

describe("model-routing task map", () => {
  it("routes each task group to unified-rotation", () => {
    expect(modelKeyForTask("discovery_interview")).toBe("unified-rotation");
    expect(modelKeyForTask("architecture_proposal")).toBe("unified-rotation");
    expect(modelKeyForTask("security_review")).toBe("unified-rotation");
    expect(modelKeyForTask("feature_spec_generation")).toBe("unified-rotation");
    expect(modelKeyForTask("nextjs_route_gen")).toBe("unified-rotation");
    expect(modelKeyForTask("chat_quick_reply")).toBe("unified-rotation");
    expect(modelKeyForTask("tech_comparison")).toBe("unified-rotation");
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
  it("promotes all tasks to deepseek-r1 for FREE plan", () => {
    expect(resolveModelKey("architecture_proposal", "FREE")).toBe(
      "deepseek-r1",
    );
    expect(resolveModelKey("discovery_interview", "FREE")).toBe("deepseek-r1");
    expect(resolveModelKey("chat_quick_reply", "FREE")).toBe("deepseek-r1");
  });

  it("promotes all tasks to claude-sonnet-4 for paid plans", () => {
    expect(resolveModelKey("architecture_proposal", "PRO")).toBe(
      "claude-sonnet-4",
    );
    expect(resolveModelKey("discovery_interview", "ENTERPRISE")).toBe(
      "claude-sonnet-4",
    );
    expect(resolveModelKey("chat_quick_reply", "PRO")).toBe("claude-sonnet-4");
  });

  it("applies unified rotation to all tasks regardless of type", () => {
    // All tasks now route through tier primary for unified rotation
    expect(resolveModelKey("nextjs_route_gen", "PRO")).toBe("claude-sonnet-4");
    expect(resolveModelKey("security_review", "ENTERPRISE")).toBe(
      "claude-sonnet-4",
    );
    expect(resolveModelKey("tech_comparison", "FREE")).toBe("deepseek-r1");
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
