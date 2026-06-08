// DeepSeek adapter. OpenAI-compatible endpoint verified via Context7
// (/websites/api-docs_deepseek): base https://api.deepseek.com, models
// `deepseek-chat` (V3.2 non-thinking) and `deepseek-reasoner` (V3.2 thinking).

import { OpenAICompatibleProvider } from "./openai-compatible";

export const deepSeekProvider = new OpenAICompatibleProvider({
  provider: "deepseek",
  endpoint: "https://api.deepseek.com/chat/completions",
  apiKeyEnvVar: "DEEPSEEK_API_KEY",
});
