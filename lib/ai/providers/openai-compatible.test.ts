import { describe, expect, it } from "vitest";
import { parseSSE } from "./openai-compatible";

/** Build a ReadableStream emitting the given string pieces as UTF-8 chunks. */
function streamOf(pieces: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let i = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (i < pieces.length) {
        controller.enqueue(encoder.encode(pieces[i]));
        i += 1;
      } else {
        controller.close();
      }
    },
  });
}

const extractContent = (json: string): string => {
  const parsed = JSON.parse(json) as {
    choices?: Array<{ delta?: { content?: string } }>;
  };
  return parsed.choices?.[0]?.delta?.content ?? "";
};

describe("parseSSE", () => {
  it("yields content deltas from complete data lines", async () => {
    const body = streamOf([
      'data: {"choices":[{"delta":{"content":"Hel"}}]}\n',
      'data: {"choices":[{"delta":{"content":"lo"}}]}\n',
      "data: [DONE]\n",
    ]);

    const chunks: string[] = [];
    for await (const chunk of parseSSE(body, extractContent))
      chunks.push(chunk);
    expect(chunks.join("")).toBe("Hello");
  });

  it("reassembles data lines split across stream chunks", async () => {
    const body = streamOf([
      'data: {"choices":[{"delta":{"con',
      'tent":"split"}}]}\n',
      "data: [DONE]\n",
    ]);

    const chunks: string[] = [];
    for await (const chunk of parseSSE(body, extractContent))
      chunks.push(chunk);
    expect(chunks.join("")).toBe("split");
  });

  it("stops at the [DONE] sentinel and ignores trailing data", async () => {
    const body = streamOf([
      'data: {"choices":[{"delta":{"content":"keep"}}]}\n',
      "data: [DONE]\n",
      'data: {"choices":[{"delta":{"content":"drop"}}]}\n',
    ]);

    const chunks: string[] = [];
    for await (const chunk of parseSSE(body, extractContent))
      chunks.push(chunk);
    expect(chunks.join("")).toBe("keep");
  });

  it("skips non-data and empty lines", async () => {
    const body = streamOf([
      ": comment line\n",
      "\n",
      'data: {"choices":[{"delta":{"content":"x"}}]}\n',
      "data: [DONE]\n",
    ]);

    const chunks: string[] = [];
    for await (const chunk of parseSSE(body, extractContent))
      chunks.push(chunk);
    expect(chunks.join("")).toBe("x");
  });
});
