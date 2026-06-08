// Groq adapter. OpenAI-compatible endpoint verified via Context7
// (/websites/console_groq): base https://api.groq.com/openai/v1, production
// models `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `gemma2-9b-it`.

import { OpenAICompatibleProvider } from "./openai-compatible";

export const groqProvider = new OpenAICompatibleProvider({
  provider: "groq",
  endpoint: "https://api.groq.com/openai/v1/chat/completions",
  apiKeyEnvVar: "GROQ_API_KEY",
});
