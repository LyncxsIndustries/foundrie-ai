import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { requireAuth } from "@/lib/auth/require-auth";
import { requireProjectMember } from "@/lib/projects/auth";
import { getDiscoveryConversation, appendConversationMessage } from "@/lib/conversations/chat";
import { callAIStream } from "@/lib/ai/rotation-engine";
import { db } from "@/lib/db";

vi.mock("@/lib/auth/require-auth", () => ({
  requireAuth: vi.fn(),
  AuthError: class AuthError extends Error {
    status = 401;
    constructor() { super("Auth"); }
  }
}));

vi.mock("@/lib/projects/auth", () => ({
  requireProjectMember: vi.fn(),
  ProjectAuthError: class ProjectAuthError extends Error {
    status = 404;
    constructor() { super("Not found"); }
  }
}));

vi.mock("@/lib/conversations/chat", () => ({
  getDiscoveryConversation: vi.fn(),
  appendConversationMessage: vi.fn(),
}));

vi.mock("@/lib/ai/rotation-engine", () => ({
  callAIStream: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    conversation: {
      findUnique: vi.fn(),
    },
    conversationMessage: {
      create: vi.fn(),
    },
  },
}));

describe("Discovery Chat Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("should return messages for a project", async () => {
      vi.mocked(requireAuth).mockResolvedValue({ id: "user-1", email: "test@test.com", role: "USER", plan: "FREE" } as any);
      vi.mocked(getDiscoveryConversation).mockResolvedValue({ messages: [] } as any);

      const request = new Request("http://localhost/api/conversations/proj-1/chat");
      const response = await GET(request, { params: Promise.resolve({ projectId: "proj-1" }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ messages: [] });
      expect(requireProjectMember).toHaveBeenCalledWith("proj-1", "user-1");
    });
  });

  describe("POST", () => {
    it("should process a message and return a stream", async () => {
      vi.mocked(requireAuth).mockResolvedValue({ id: "user-1", email: "test@test.com", role: "USER", plan: "FREE" } as any);
      vi.mocked(appendConversationMessage).mockResolvedValue([{ role: "user", content: "hello" } as any]);
      vi.mocked(db.conversation.findUnique).mockResolvedValue(null); // No conversation found (best-effort persistence)
      
      const mockIterator = (async function* () {
        yield "Hi ";
        yield "there!";
      })();

      vi.mocked(callAIStream).mockResolvedValue({
        status: "ok",
        stream: mockIterator,
      } as any);

      const request = new Request("http://localhost/api/conversations/proj-1/chat", {
        method: "POST",
        body: JSON.stringify({ message: { content: "hello" } }),
      });

      const response = await POST(request, { params: Promise.resolve({ projectId: "proj-1" }) });

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("text/event-stream");
      expect(callAIStream).toHaveBeenCalled();
    });

    it("should handle exhausted AI providers", async () => {
      vi.mocked(requireAuth).mockResolvedValue({ id: "user-1", email: "test@test.com", role: "USER", plan: "FREE" } as any);
      vi.mocked(appendConversationMessage).mockResolvedValue([{ role: "user", content: "hello" } as any]);
      vi.mocked(db.conversation.findUnique).mockResolvedValue(null);
      
      vi.mocked(callAIStream).mockResolvedValue({
        status: "queued",
      } as any);

      const request = new Request("http://localhost/api/conversations/proj-1/chat", {
        method: "POST",
        body: JSON.stringify({ message: { content: "hello" } }),
      });

      const response = await POST(request, { params: Promise.resolve({ projectId: "proj-1" }) });

      expect(response.status).toBe(503);
    });

    it("should succeed even if structured persistence succeeds", async () => {
      vi.mocked(requireAuth).mockResolvedValue({ id: "user-1", email: "test@test.com", role: "USER", plan: "FREE" } as any);
      vi.mocked(appendConversationMessage).mockResolvedValue([{ role: "user", content: "hello" } as any]);
      vi.mocked(db.conversation.findUnique).mockResolvedValue({ id: "conv-1" } as any);
      vi.mocked(db.conversationMessage.create).mockResolvedValue({ id: "msg-1" } as any);

      const mockIterator = (async function* () {
        yield "response";
      })();

      vi.mocked(callAIStream).mockResolvedValue({
        status: "ok",
        stream: mockIterator,
      } as any);

      const request = new Request("http://localhost/api/conversations/proj-1/chat", {
        method: "POST",
        body: JSON.stringify({ message: { content: "hello" } }),
      });

      const response = await POST(request, { params: Promise.resolve({ projectId: "proj-1" }) });

      expect(response.status).toBe(200);
      expect(db.conversationMessage.create).toHaveBeenCalled();
    });

    it("should succeed even if structured persistence fails", async () => {
      vi.mocked(requireAuth).mockResolvedValue({ id: "user-1", email: "test@test.com", role: "USER", plan: "FREE" } as any);
      vi.mocked(appendConversationMessage).mockResolvedValue([{ role: "user", content: "hello" } as any]);
      vi.mocked(db.conversation.findUnique).mockResolvedValue({ id: "conv-1" } as any);
      vi.mocked(db.conversationMessage.create).mockRejectedValue(new Error("DB error"));

      const mockIterator = (async function* () {
        yield "response";
      })();

      vi.mocked(callAIStream).mockResolvedValue({
        status: "ok",
        stream: mockIterator,
      } as any);

      const request = new Request("http://localhost/api/conversations/proj-1/chat", {
        method: "POST",
        body: JSON.stringify({ message: { content: "hello" } }),
      });

      const response = await POST(request, { params: Promise.resolve({ projectId: "proj-1" }) });

      expect(response.status).toBe(200);
      expect(db.conversationMessage.create).toHaveBeenCalled();
    });
  });
});
