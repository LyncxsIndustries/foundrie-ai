// Shared base for OpenAI-compatible providers.
//
// OpenRouter, DeepSeek, and Groq all expose the OpenAI `POST /chat/completions`
// contract verified via Context7:
//   - OpenRouter: https://openrouter.ai/api/v1/chat/completions
//   - DeepSeek:   https://api.deepseek.com/chat/completions
//   - Groq:       https://api.groq.com/openai/v1/chat/completions
// All use `Authorization: Bearer <key>`, a body of
// `{ model, messages, max_tokens?, temperature?, stream? }`, and a response of
// `{ choices: [{ message: { content } }], usage: { total_tokens } }`. SSE
// streaming yields `data: {choices:[{delta:{content}}]}` lines ending in
// `data: [DONE]`. This base implements that contract once; concrete adapters
// supply only the endpoint, env var, provider id, and optional extra headers.

import {
  type AICallParams,
  type AIProvider,
  type AIResponse,
  type ProviderId,
  ProviderCallError,
  isRetryableStatus,
} from "./types";

interface OpenAICompatibleConfig {
  provider: ProviderId;
  /** Full chat-completions URL. */
  endpoint: string;
  /** Name of the env var holding the API key. */
  apiKeyEnvVar: string;
  /** Provider-specific headers beyond auth/content-type (e.g. OpenRouter referer). */
  extraHeaders?: Record<string, string>;
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
  usage?: { total_tokens?: number };
}

interface ChatCompletionStreamChunk {
  choices?: Array<{ delta?: { content?: string | null } }>;
}

const DEFAULT_MAX_TOKENS = 4096;

export class OpenAICompatibleProvider implements AIProvider {
  readonly name: ProviderId;
  private readonly endpoint: string;
  private readonly apiKeyEnvVar: string;
  private readonly extraHeaders: Record<string, string>;

  constructor(config: OpenAICompatibleConfig) {
    this.name = config.provider;
    this.endpoint = config.endpoint;
    this.apiKeyEnvVar = config.apiKeyEnvVar;
    this.extraHeaders = config.extraHeaders ?? {};
  }

  private apiKey(): string | undefined {
    const key = process.env[this.apiKeyEnvVar];
    return key && key.length > 0 ? key : undefined;
  }

  async isAvailable(): Promise<boolean> {
    // Availability is configuration-driven: a provider with no key cannot
    // serve traffic. Network reachability is determined per-call so a single
    // probe does not add latency to every request.
    return this.apiKey() !== undefined;
  }

  private headers(key: string): Record<string, string> {
    return {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...this.extraHeaders,
    };
  }

  private body(params: AICallParams, stream: boolean): string {
    // Build the user message content. When media attachments are present,
    // use the OpenAI vision format: an array of {type:"text"} and
    // {type:"image_url"} blocks (supported by OpenRouter and gpt-4-vision).
    const userContent: unknown =
      params.media && params.media.length > 0
        ? [
            { type: "text", text: params.userPrompt },
            ...params.media.map((m) => ({
              type: "image_url",
              image_url: {
                url: `data:${m.mimeType};base64,${m.base64Data}`,
              },
            })),
          ]
        : params.userPrompt;

    return JSON.stringify({
      model: params.model,
      messages: [
        { role: "system", content: params.systemPrompt },
        { role: "user", content: userContent },
      ],
      max_tokens: params.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: params.temperature ?? 0.7,
      stream,
    });
  }

  async call(params: AICallParams): Promise<AIResponse> {
    const key = this.apiKey();
    if (!key) {
      throw new ProviderCallError(`${this.name} API key not configured`, {
        provider: this.name,
        model: params.model,
        retryable: false,
      });
    }

    let response: Response;
    try {
      response = await fetch(this.endpoint, {
        method: "POST",
        headers: this.headers(key),
        body: this.body(params, false),
        signal: params.signal,
      });
    } catch (cause) {
      // Network-level failure (DNS, connection reset, abort) is transient.
      throw new ProviderCallError(`${this.name} request failed`, {
        provider: this.name,
        model: params.model,
        retryable: true,
        cause,
      });
    }

    if (!response.ok) {
      throw new ProviderCallError(`${this.name} returned ${response.status}`, {
        provider: this.name,
        model: params.model,
        status: response.status,
        retryable: isRetryableStatus(response.status),
      });
    }

    const data = (await response.json()) as ChatCompletionResponse;
    const text = data.choices?.[0]?.message?.content ?? "";
    if (text.length === 0) {
      throw new ProviderCallError(`${this.name} returned an empty completion`, {
        provider: this.name,
        model: params.model,
        retryable: true,
      });
    }

    return {
      text,
      model: params.model,
      provider: this.name,
      tokensUsed: data.usage?.total_tokens,
    };
  }

  async *callStream(params: AICallParams): AsyncIterable<string> {
    const key = this.apiKey();
    if (!key) {
      throw new ProviderCallError(`${this.name} API key not configured`, {
        provider: this.name,
        model: params.model,
        retryable: false,
      });
    }

    let response: Response;
    try {
      response = await fetch(this.endpoint, {
        method: "POST",
        headers: this.headers(key),
        body: this.body(params, true),
        signal: params.signal,
      });
    } catch (cause) {
      throw new ProviderCallError(`${this.name} stream request failed`, {
        provider: this.name,
        model: params.model,
        retryable: true,
        cause,
      });
    }

    if (!response.ok || !response.body) {
      throw new ProviderCallError(
        `${this.name} stream returned ${response.status}`,
        {
          provider: this.name,
          model: params.model,
          status: response.status,
          retryable: isRetryableStatus(response.status),
        },
      );
    }

    yield* parseSSE(response.body, (chunk) => {
      const parsed = JSON.parse(chunk) as ChatCompletionStreamChunk;
      return parsed.choices?.[0]?.delta?.content ?? "";
    });
  }
}

/**
 * Parse an SSE stream body, invoking `extract` on each `data:` payload and
 * yielding non-empty text deltas. Stops at the `[DONE]` sentinel. Exported for
 * unit testing the line-buffer logic independently of network transport.
 */
export async function* parseSSE(
  body: ReadableStream<Uint8Array>,
  extract: (jsonChunk: string) => string,
): AsyncIterable<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE events are separated by newlines; process complete lines only and
      // keep the trailing partial line in the buffer.
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (!line.startsWith("data:")) continue;

        const payload = line.slice("data:".length).trim();
        if (payload === "[DONE]") return;
        if (payload.length === 0) continue;

        const delta = extract(payload);
        if (delta.length > 0) yield delta;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
