import { task, metadata, logger } from "@trigger.dev/sdk";
import { aiChatStream } from "./streams";
import { callAIStream } from "@/lib/ai/rotation-engine";
import { getDiscoverySystemPrompt } from "@/lib/ai/prompts/discovery";
import { ChatMessage } from "@/lib/conversations/chat";
import { db } from "@/lib/db";
import { AIMediaAttachment } from "@/lib/ai/providers/types";
import { validateCloudinaryUrl } from "@/lib/validation/cloudinary";

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
    attachments?: any[];
  }, { ctx }) => {
    const { projectId, userPlan, historyText, attachmentContext, conversationId, attachments } = payload;
    
    // Initialize metadata with rich status for frontend display
    metadata
      .set("stage", "initializing")
      .set("status", "Gathering conversation context…")
      .set("logs", [
        "Task queued in Trigger.dev",
        "Loading conversation history",
      ]);

    // Download and convert images to base64
    let media: AIMediaAttachment[] | undefined = undefined;
    if (attachments && attachments.length > 0) {
      metadata.set("status", "Processing media attachments...");
      media = [];
      for (const att of attachments) {
        if (att.type === 'IMAGE' && att.cloudinaryUrl) {
          try {
            // Revalidate URL before fetching (SSRF protection)
            const urlValidation = validateCloudinaryUrl(att.cloudinaryUrl);
            if (!urlValidation.valid) {
              metadata.append("logs", `⚠️ Skipping invalid URL for ${att.originalName}: ${urlValidation.error}`);
              continue;
            }

            metadata.append("logs", `Fetching media: ${att.originalName}`);
            const res = await fetch(att.cloudinaryUrl, {
              redirect: 'error' // Reject redirects to prevent SSRF
            });
            if (res.ok) {
              const arrayBuffer = await res.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              media.push({
                mimeType: att.mimeType || 'image/jpeg',
                base64Data: buffer.toString('base64')
              });
            } else {
              metadata.append("logs", `Failed to fetch media: ${res.statusText}`);
            }
          } catch (e) {
            console.error("Failed to fetch image attachment", e);
            metadata.append("logs", `Error fetching media: ${String(e)}`);
          }
        }
      }
      if (media.length === 0) media = undefined;
    }

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
      media,
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

    if (aiFullText.trim() && conversationId) {
      // Use Trigger.dev run ID as stable idempotency key
      const generationId = ctx.run.id;

      // Helper to retry database saves 
      const saveWithRetry = async (operation: () => Promise<any>, maxRetries = 3) => {
        for (let i = 0; i < maxRetries; i++) {
          try {
            return await operation();
          } catch (error: any) {
            if (i === maxRetries - 1) throw error;
            logger.warn("DB write failed, retrying", {
              attempt: i + 1,
              maxRetries,
              errorMessage: error?.message || 'Unknown error',
              trace_id: ctx.run.id,
            });
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
          }
        }
      };

      try {
        // Check if message already exists (idempotency check)
        const existingMessage = await db.conversationMessage.findFirst({
          where: {
            conversationId,
            projectId,
            role: 'ASSISTANT',
            metadata: {
              path: ['generationId'],
              equals: generationId,
            },
          },
        });

        if (existingMessage) {
          logger.info("Assistant message already persisted, skipping duplicate insert", {
            messageId: existingMessage.id,
            generationId,
            trace_id: ctx.run.id,
          });
          metadata.append("logs", "Message already saved (idempotency check passed)");
        } else {
          // Create new message with generation ID in metadata
          await saveWithRetry(() => db.conversationMessage.create({
            data: {
              conversationId,
              projectId,
              role: 'ASSISTANT',
              content: aiFullText,
              metadata: {
                generationId,
                runId: ctx.run.id,
              },
            },
          }));

          logger.info("Assistant message persisted successfully", {
            generationId,
            trace_id: ctx.run.id,
            contentLength: aiFullText.length,
          });
        }
      } catch (err: any) {
        // Log structured error and rethrow to fail the task
        logger.error("Failed to persist assistant message after retries", {
          error: err.message,
          stack: err.stack,
          trace_id: ctx.run.id,
          projectId,
          conversationId,
        });

        metadata
          .set("stage", "error")
          .set("status", "Failed to save message")
          .append("logs", `ERROR: ${err.message}`);

        // Rethrow to ensure task fails visibly
        throw err;
      }
    }

    metadata
      .set("stage", "completed")
      .set("status", "Done")
      .append("logs", "Message saved successfully");

    return { success: true };
  },
});
