import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/require-auth";
import { requireProjectMember, ProjectAuthError } from "@/lib/projects/auth";
import { getDiscoveryConversation, appendConversationMessage, ChatMessage } from "@/lib/conversations/chat";
import { callAIStream } from "@/lib/ai/rotation-engine";
import { getDiscoverySystemPrompt } from "@/lib/ai/prompts/discovery";

// Polyfill Iterator.from or use a custom stream encoder
function iteratorToStream(iterable: AsyncIterable<string>) {
  let it: AsyncIterator<string>;
  return new ReadableStream({
    start() {
      it = iterable[Symbol.asyncIterator]();
    },
    async pull(controller) {
      try {
        const { value, done } = await it.next();
        if (done) {
          controller.close();
        } else {
          controller.enqueue(new TextEncoder().encode(value));
        }
      } catch (e) {
        controller.error(e);
      }
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await requireAuth();
    const { projectId } = await params;
    await requireProjectMember(projectId, user.id);

    const { messages } = await getDiscoveryConversation(projectId);
    return NextResponse.json({ messages });
  } catch (error) {
    if (error instanceof AuthError) return new NextResponse(error.message, { status: error.status });
    if (error instanceof ProjectAuthError) return new NextResponse(error.message, { status: error.status });
    console.error("GET /api/conversations/[projectId]/chat error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await requireAuth();
    const { projectId } = await params;
    await requireProjectMember(projectId, user.id);

    const { message } = await request.json();
    if (!message || typeof message.content !== 'string') {
      return new NextResponse("Invalid message", { status: 400 });
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: message.content,
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = await appendConversationMessage(projectId, userMessage);

    // Format conversation history for the AI
    const historyText = updatedMessages.map(m => {
      const roleName = m.role === "user" ? "User" : "Assistant";
      return `${roleName}:\n${m.content}`;
    }).join("\n\n");

    const systemPrompt = getDiscoverySystemPrompt();
    
    // We add the final directive to just respond to the last User message, considering history.
    const userPrompt = `Here is the conversation history:\n\n${historyText}\n\nRespond to the last User message. Do not prefix your response with "Assistant:".`;

    const result = await callAIStream("streaming_chat", {
      plan: user.plan,
      systemPrompt,
      userPrompt,
      temperature: 0.7,
    });

    if (result.status === "queued") {
      return new NextResponse("All AI providers exhausted or rate limited.", { status: 503 });
    }

    const stream = iteratorToStream(result.stream);
    
    // Return a TransformStream that captures the AI response so we can save it.
    let aiFullText = "";
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        aiFullText += new TextDecoder().decode(chunk);
        controller.enqueue(chunk);
      },
      async flush() {
        if (aiFullText.trim()) {
          const aiMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: aiFullText,
            createdAt: new Date().toISOString(),
          };
          // Append the assistant's message asynchronously after stream closes.
          await appendConversationMessage(projectId, aiMessage).catch(err => {
            console.error("Failed to append AI message", err);
          });
        }
      }
    });

    return new Response(stream.pipeThrough(transformStream), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    if (error instanceof AuthError) return new NextResponse(error.message, { status: error.status });
    if (error instanceof ProjectAuthError) return new NextResponse(error.message, { status: error.status });
    console.error("POST /api/conversations/[projectId]/chat error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
