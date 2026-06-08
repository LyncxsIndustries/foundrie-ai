// Provider registry: maps each ProviderId to its singleton adapter. The
// rotation engine resolves fallback-chain entries to adapters through this map.
// Every external AI backend Foundrie can reach is registered here and nowhere
// else, enforcing the invariant that direct provider calls live only in
// `lib/ai/providers/`.

import type { AIProvider, ProviderId } from "./types";
import { anthropicProvider } from "./anthropic";
import { geminiProvider } from "./gemini";
import { deepSeekProvider } from "./deepseek";
import { groqProvider } from "./groq";
import { openRouterProvider } from "./openrouter";

export const providers: Record<ProviderId, AIProvider> = {
  anthropic: anthropicProvider,
  gemini: geminiProvider,
  deepseek: deepSeekProvider,
  groq: groqProvider,
  openrouter: openRouterProvider,
};

export function getProvider(id: ProviderId): AIProvider {
  return providers[id];
}

export * from "./types";
