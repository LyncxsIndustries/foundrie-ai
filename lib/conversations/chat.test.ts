import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDiscoveryConversation, appendConversationMessage } from "./chat";
import { db } from "../db";

vi.mock("../db", () => ({
  db: {
    conversation: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("Chat Helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a new conversation if one doesn't exist", async () => {
    vi.mocked(db.conversation.findUnique).mockResolvedValue(null);
    vi.mocked(db.conversation.create).mockResolvedValue({
      id: "conv-1",
      projectId: "proj-1",
      phase: "DISCOVERY",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const result = await getDiscoveryConversation("proj-1");
    expect(db.conversation.create).toHaveBeenCalledWith({
      data: {
        projectId: "proj-1",
        phase: "DISCOVERY",
        messages: [],
      },
    });
    expect(result.messages).toEqual([]);
  });

  it("should append a message and enforce size limit", async () => {
    const mockMessages = Array.from({ length: 100 }).map((_, i) => ({
      id: `msg-${i}`,
      role: "user" as const,
      content: `Message ${i}`,
      createdAt: new Date().toISOString(),
    }));

    vi.mocked(db.conversation.findUnique).mockResolvedValue({
      id: "conv-1",
      projectId: "proj-1",
      phase: "DISCOVERY",
      messages: mockMessages as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    vi.mocked(db.conversation.update).mockResolvedValue({} as any);

    const newMessage = {
      id: "new-msg",
      role: "assistant" as const,
      content: "New message",
      createdAt: new Date().toISOString(),
    };

    const result = await appendConversationMessage("proj-1", newMessage);
    
    // Total should remain 100 because of MAX_MESSAGES limit
    expect(result.length).toBe(100);
    expect(result[99]).toEqual(newMessage);
    expect(result[0].id).toBe("msg-1"); // msg-0 should be shifted out

    expect(db.conversation.update).toHaveBeenCalledWith({
      where: { projectId: "proj-1" },
      data: { messages: result as any },
    });
  });
});
