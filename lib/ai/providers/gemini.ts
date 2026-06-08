// Google Gemini adapter. REST contract verified via Context7
// (/websites/ai_google_dev_api):
//   POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
//   header: x-goog-api-key: <GEMINI_API_KEY>
//   body:   { systemInstruction?: {parts:[{text}]}, contents: [{role,parts:[{text}]}],
//             generationConfig: { maxOutputTokens, temperature } }
//   resp:   { candidates: [{ content: { parts: [{ text }] } }],
//             usageMetadata: { totalTokenCount } }
// Streaming uses the `:streamGenerateContent?alt=sse` variant, which emits SSE
// `data:` lines each carrying a partial GenerateContentResponse.

import {
  type AICallParams,
  type AIProvider,
  type AIResponse,
  ProviderCallError,
  isRetryableStatus,
} from "./types";
import { parseSSE } from "./openai-compatible";

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MAX_TOKENS = 4096;

interface GenerateContentResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  usageMetadata?: { totalTokenCount?: number };
}

function requestBody(params: AICallParams) {
  return {
    systemInstruction: params.systemPrompt
      ? { parts: [{ text: params.systemPrompt }] }
      : undefined,
    contents: [{ role: "user", parts: [{ text: params.userPrompt }] }],
    generationConfig: {
      maxOutputTokens: params.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: params.temperature ?? 0.7,
    },
  };
}

function extractText(data: GenerateContentResponse): string {
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p) => p.text ?? "").join("");
}

class GeminiProvider implements AIProvider {
  readonly name = "gemini" as const;

  private apiKey(): string | undefined {
    const key = process.env.GEMINI_API_KEY;
    return key && key.length > 0 ? key : undefined;
  }

  async isAvailable(): Promise<boolean> {
    return this.apiKey() !== undefined;
  }

  private url(
    model: string,
    method: "generateContent" | "streamGenerateContent",
  ): string {
    const suffix = method === "streamGenerateContent" ? "?alt=sse" : "";
    return `${BASE}/${encodeURIComponent(model)}:${method}${suffix}`;
  }

  async call(params: AICallParams): Promise<AIResponse> {
    const key = this.apiKey();
    if (!key) {
      throw new ProviderCallError("gemini API key not configured", {
        provider: this.name,
        model: params.model,
        retryable: false,
      });
    }

    let response: Response;
    try {
      response = await fetch(this.url(params.model, "generateContent"), {
        method: "POST",
        headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify(requestBody(params)),
        signal: params.signal,
      });
    } catch (cause) {
      throw new ProviderCallError("gemini request failed", {
        provider: this.name,
        model: params.model,
        retryable: true,
        cause,
      });
    }

    if (!response.ok) {
      throw new ProviderCallError(`gemini returned ${response.status}`, {
        provider: this.name,
        model: params.model,
        status: response.status,
        retryable: isRetryableStatus(response.status),
      });
    }

    const data = (await response.json()) as GenerateContentResponse;
    const text = extractText(data);
    if (text.length === 0) {
      throw new ProviderCallError("gemini returned an empty completion", {
        provider: this.name,
        model: params.model,
        retryable: true,
      });
    }

    return {
      text,
      model: params.model,
      provider: this.name,
      tokensUsed: data.usageMetadata?.totalTokenCount,
    };
  }

  async *callStream(params: AICallParams): AsyncIterable<string> {
    const key = this.apiKey();
    if (!key) {
      throw new ProviderCallError("gemini API key not configured", {
        provider: this.name,
        model: params.model,
        retryable: false,
      });
    }

    let response: Response;
    try {
      response = await fetch(this.url(params.model, "streamGenerateContent"), {
        method: "POST",
        headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify(requestBody(params)),
        signal: params.signal,
      });
    } catch (cause) {
      throw new ProviderCallError("gemini stream request failed", {
        provider: this.name,
        model: params.model,
        retryable: true,
        cause,
      });
    }

    if (!response.ok || !response.body) {
      throw new ProviderCallError(`gemini stream returned ${response.status}`, {
        provider: this.name,
        model: params.model,
        status: response.status,
        retryable: isRetryableStatus(response.status),
      });
    }

    yield* parseSSE(response.body, (chunk) => {
      const parsed = JSON.parse(chunk) as GenerateContentResponse;
      return extractText(parsed);
    });
  }
}

export const geminiProvider = new GeminiProvider();
