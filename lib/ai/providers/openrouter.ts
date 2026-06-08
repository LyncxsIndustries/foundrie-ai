// OpenRouter adapter. OpenAI-compatible chat-completions endpoint verified via
// Context7 (/websites/openrouter_ai). OpenRouter recommends (optionally) sending
// HTTP-Referer and X-Title headers to attribute traffic; both are derived from
// public app config, never secrets.

import { OpenAICompatibleProvider } from "./openai-compatible";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://foundrieai.com";

export const openRouterProvider = new OpenAICompatibleProvider({
  provider: "openrouter",
  endpoint: "https://openrouter.ai/api/v1/chat/completions",
  apiKeyEnvVar: "OPENROUTER_API_KEY",
  extraHeaders: {
    "HTTP-Referer": appUrl,
    "X-Title": "Foundrie AI",
  },
});
