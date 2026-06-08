// Anthropic (Claude) adapter. Messages API contract verified via Context7
// (/websites/platform_claude_en_api):
//   POST https://api.anthropic.com/v1/messages
//   headers: x-api-key: <ANTHROPIC_API_KEY>, anthropic-version: 2023-06-01
//   body:   { model, system?, messages: [{role,content}], max_tokens (required),
//             temperature?, stream? }
//   resp:   { content: [{ type:"text", text }], usage: {input_tokens, output_tokens} }
// Streaming emits SSE `content_block_delta` events with `delta.text`.

import {
  type AICallParams,
  type AIProvider,
  type AIResponse,
  ProviderCallError,
  isRetryableStatus,
} from "./types";
import { parseSSE } from "./openai-compatible";

const ENDPOINT = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
// Anthropic requires max_tokens; default to a generous planning-sized budget.
const DEFAULT_MAX_TOKENS = 4096;

interface MessagesResponse {
  content?: Array<{ type?: string; text?: string }>;
  usage?: { input_tokens?: number; output_tokens?: number };
}

interface MessagesStreamEvent {
  type?: string;
  delta?: { type?: string; text?: string };
}

function requestBody(params: AICallParams, stream: boolean) {
  return {
    model: params.model,
    system: params.systemPrompt || undefined,
    messages: [{ role: "user", content: params.userPrompt }],
    max_tokens: params.maxTokens ?? DEFAULT_MAX_TOKENS,
    temperature: params.temperature ?? 0.7,
    stream,
  };
}

function extractText(data: MessagesResponse): string {
  return (data.content ?? [])
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("");
}

class AnthropicProvider implements AIProvider {
  readonly name = "anthropic" as const;

  private apiKey(): string | undefined {
    const key = process.env.ANTHROPIC_API_KEY;
    return key && key.length > 0 ? key : undefined;
  }

  async isAvailable(): Promise<boolean> {
    return this.apiKey() !== undefined;
  }

  private headers(key: string): Record<string, string> {
    return {
      "x-api-key": key,
      "anthropic-version": ANTHROPIC_VERSION,
      "Content-Type": "application/json",
    };
  }

  async call(params: AICallParams): Promise<AIResponse> {
    const key = this.apiKey();
    if (!key) {
      throw new ProviderCallError("anthropic API key not configured", {
        provider: this.name,
        model: params.model,
        retryable: false,
      });
    }

    let response: Response;
    try {
      response = await fetch(ENDPOINT, {
        method: "POST",
        headers: this.headers(key),
        body: JSON.stringify(requestBody(params, false)),
        signal: params.signal,
      });
    } catch (cause) {
      throw new ProviderCallError("anthropic request failed", {
        provider: this.name,
        model: params.model,
        retryable: true,
        cause,
      });
    }

    if (!response.ok) {
      throw new ProviderCallError(`anthropic returned ${response.status}`, {
        provider: this.name,
        model: params.model,
        status: response.status,
        retryable: isRetryableStatus(response.status),
      });
    }

    const data = (await response.json()) as MessagesResponse;
    const text = extractText(data);
    if (text.length === 0) {
      throw new ProviderCallError("anthropic returned an empty completion", {
        provider: this.name,
        model: params.model,
        retryable: true,
      });
    }

    const usage = data.usage;
    const tokensUsed =
      usage &&
      (usage.input_tokens !== undefined || usage.output_tokens !== undefined)
        ? (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0)
        : undefined;

    return { text, model: params.model, provider: this.name, tokensUsed };
  }

  async *callStream(params: AICallParams): AsyncIterable<string> {
    const key = this.apiKey();
    if (!key) {
      throw new ProviderCallError("anthropic API key not configured", {
        provider: this.name,
        model: params.model,
        retryable: false,
      });
    }

    let response: Response;
    try {
      response = await fetch(ENDPOINT, {
        method: "POST",
        headers: this.headers(key),
        body: JSON.stringify(requestBody(params, true)),
        signal: params.signal,
      });
    } catch (cause) {
      throw new ProviderCallError("anthropic stream request failed", {
        provider: this.name,
        model: params.model,
        retryable: true,
        cause,
      });
    }

    if (!response.ok || !response.body) {
      throw new ProviderCallError(
        `anthropic stream returned ${response.status}`,
        {
          provider: this.name,
          model: params.model,
          status: response.status,
          retryable: isRetryableStatus(response.status),
        },
      );
    }

    yield* parseSSE(response.body, (chunk) => {
      const event = JSON.parse(chunk) as MessagesStreamEvent;
      if (
        event.type === "content_block_delta" &&
        event.delta?.type === "text_delta"
      ) {
        return event.delta.text ?? "";
      }
      return "";
    });
  }
}

export const anthropicProvider = new AnthropicProvider();
