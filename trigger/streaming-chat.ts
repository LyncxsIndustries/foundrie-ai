import { task, metadata } from "@trigger.dev/sdk";
import { aiChatStream } from "./streams";
import { callAIStream } from "@/lib/ai/rotation-engine";
import { getDiscoverySystemPrompt } from "@/lib/ai/prompts/discovery";
import { appendConversationMessage, ChatMessage } from "@/lib/conversations/chat";
import { db } from "@/lib/db";

export const streamingChatTask = task({
  id: "streaming-chat-task",
  retry: {
    maxAttempts: 1, // Disable retries so we don't repeat AI generation to the user blindly
  },
  run: async (payload: { 
    projectId: string; 
    userPlan: string;
    historyText: string;
    attachmentContext: string;
    conversationId: string | undefined;
  }) => {
    const { projectId, userPlan, historyText, attachmentContext, conversationId } = payload;
    
    // Initialize metadata with rich status for frontend display
    metadata
      .set("stage", "initializing")
      .set("status", "Gathering conversation context…")
      .set("logs", [
        "Task queued in Trigger.dev",
        "Loading conversation history",
      ]);

    const systemPrompt = getDiscoverySystemPrompt();
    const userPrompt = `Here is the conversation history:\n\n${historyText}${attachmentContext}\n\nRespond to the last User message. Do not prefix your response with "Assistant:".`;

    // Update metadata before calling AI
    metadata
      .set("stage", "connecting")
      .set("status", "Connecting to AI rotation engine…")
      .append("logs", "Connecting to rotation engine");

    const result = await callAIStream("streaming_chat", {
      plan: userPlan as any,
      systemPrompt,
      userPrompt,
      temperature: 0.7,
    });

    if (result.status === "queued" || !result.stream) {
      metadata
        .set("stage", "error")
        .set("status", "All AI providers exhausted")
        .append("logs", "ERROR: All providers exhausted or rate limited");
      throw new Error("All AI providers exhausted or rate limited.");
    }

    // Update metadata to streaming phase
    metadata
      .set("stage", "streaming")
      .set("status", "AI is generating a response…")
      .append("logs", `Connected via ${result.provider || 'provider'}`);

    // We will accumulate the text while streaming it to the frontend
    let aiFullText = "";
    
    // We create a proxy AsyncIterable that captures the text while yielding it to Trigger's stream
    const capturingIterator: AsyncIterable<string> = {
      async *[Symbol.asyncIterator]() {
        for await (const chunk of result.stream!) {
          aiFullText += chunk;
          yield chunk;
        }
      }
    };

    // Pipe the capturing iterator to the Trigger stream
    const { waitUntilComplete } = aiChatStream.pipe(capturingIterator);
    await waitUntilComplete();

    metadata
      .set("stage", "saving")
      .set("status", "Saving response…")
      .append("logs", "Stream complete, saving message to database");

    if (aiFullText.trim()) {
      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: aiFullText,
        createdAt: new Date().toISOString(),
      };

      // Helper to retry database saves 
      const saveWithRetry = async (operation: () => Promise<any>, maxRetries = 3) => {
        for (let i = 0; i < maxRetries; i++) {
          try {
            return await operation();
          } catch (error: any) {
            if (i === maxRetries - 1) throw error;
            console.warn(`DB write failed (attempt ${i + 1}/${maxRetries}), retrying in ${Math.pow(2, i)}s...`, error?.message || 'Unknown error');
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
          }
        }
      };

      await saveWithRetry(() => appendConversationMessage(projectId, aiMessage)).catch(err => {
        console.error("Failed to append AI message after retries:", err);
      });
      
      if (conversationId) {
        await saveWithRetry(() => db.conversationMessage.create({
          data: {
            conversationId,
            projectId,
            role: 'ASSISTANT',
            content: aiFullText,
          },
        })).catch(err => {
          console.error("Failed to persist structured AI message after retries:", err);
        });
      }
    }

    metadata
      .set("stage", "completed")
      .set("status", "Done")
      .append("logs", "Message saved successfully");

    return { success: true };
  },
});
