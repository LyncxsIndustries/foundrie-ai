// Nvidia NIM adapter for the AI rotation engine.
// Nvidia Build (https://build.nvidia.com) provides high-performance inference
// for many models including Llama, Mistral, and others through their NIM API.
// The API is OpenAI-compatible but hosted at api.nvidia.com.

import {
  type AIProvider,
  type AICallParams,
  type AIResponse,
  ProviderCallError,
  isRetryableStatus,
} from "./types";

export class NvidiaProvider implements AIProvider {
  readonly name = "nvidia" as const;

  async isAvailable(): Promise<boolean> {
    return !!process.env.NVIDIA_API_KEY;
  }

  async call(params: AICallParams): Promise<AIResponse> {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      throw new ProviderCallError("Nvidia API key not configured", {
        provider: this.name,
        model: params.model,
        retryable: false,
      });
    }

    const messages: Array<{ role: string; content: string }> = [];
    if (params.systemPrompt) {
      messages.push({ role: "system", content: params.systemPrompt });
    }
    messages.push({ role: "user", content: params.userPrompt });

    const body = {
      model: params.model,
      messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 8192,
      stream: false,
    };

    try {
      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: params.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ProviderCallError(
          `Nvidia API error: ${response.status} ${errorText}`,
          {
            provider: this.name,
            model: params.model,
            status: response.status,
            retryable: isRetryableStatus(response.status),
          },
        );
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      const tokensUsed = data.usage?.total_tokens;

      return {
        text,
        model: params.model,
        provider: this.name,
        tokensUsed,
      };
    } catch (error) {
      if (error instanceof ProviderCallError) throw error;
      throw new ProviderCallError(
        `Nvidia request failed: ${error instanceof Error ? error.message : String(error)}`,
        {
          provider: this.name,
          model: params.model,
          retryable: true,
          cause: error,
        },
      );
    }
  }

  async *callStream(params: AICallParams): AsyncIterable<string> {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      throw new ProviderCallError("Nvidia API key not configured", {
        provider: this.name,
        model: params.model,
        retryable: false,
      });
    }

    const messages: Array<{ role: string; content: string }> = [];
    if (params.systemPrompt) {
      messages.push({ role: "system", content: params.systemPrompt });
    }
    messages.push({ role: "user", content: params.userPrompt });

    const body = {
      model: params.model,
      messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 8192,
      stream: true,
    };

    try {
      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: params.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ProviderCallError(
          `Nvidia API error: ${response.status} ${errorText}`,
          {
            provider: this.name,
            model: params.model,
            status: response.status,
            retryable: isRetryableStatus(response.status),
          },
        );
      }

      if (!response.body) {
        throw new ProviderCallError("No response body for streaming", {
          provider: this.name,
          model: params.model,
          retryable: true,
        });
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;
          if (!trimmed.startsWith("data: ")) continue;

          try {
            const json = JSON.parse(trimmed.slice(6));
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch {
            // Malformed SSE line, skip
          }
        }
      }
    } catch (error) {
      if (error instanceof ProviderCallError) throw error;
      throw new ProviderCallError(
        `Nvidia streaming failed: ${error instanceof Error ? error.message : String(error)}`,
        {
          provider: this.name,
          model: params.model,
          retryable: true,
          cause: error,
        },
      );
    }
  }
}

export const nvidiaProvider = new NvidiaProvider();
