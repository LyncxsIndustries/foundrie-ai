import { streams } from "@trigger.dev/sdk";

export const aiChatStream = streams.define<string>({
  id: "ai-chat-stream",
});
