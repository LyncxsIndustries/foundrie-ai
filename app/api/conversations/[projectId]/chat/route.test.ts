import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { requireAuth } from "@/lib/auth/require-auth";
import { requireProjectMember } from "@/lib/projects/auth";
import { getDiscoveryConversation, appendConversationMessage } from "@/lib/conversations/chat";
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

const mockTrigger = vi.fn();
const mockCreatePublicToken = vi.fn();

vi.mock("@trigger.dev/sdk", () => ({
  tasks: {
    trigger: (...args: unknown[]) => mockTrigger(...args),
  },
  auth: {
    createPublicToken: (...args: unknown[]) => mockCreatePublicToken(...args),
  },
}));

describe("Discovery Chat Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTrigger.mockResolvedValue({ id: "run_test123" });
    mockCreatePublicToken.mockResolvedValue("pub_token_xyz");
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
    it("should trigger a background task and return runId + token", async () => {
      vi.mocked(requireAuth).mockResolvedValue({ id: "user-1", email: "test@test.com", role: "USER", plan: "FREE" } as any);
      vi.mocked(appendConversationMessage).mockResolvedValue([{ role: "user", content: "hello" } as any]);
      vi.mocked(db.conversation.findUnique).mockResolvedValue(null);

      const request = new Request("http://localhost/api/conversations/proj-1/chat", {
        method: "POST",
        body: JSON.stringify({ message: { content: "hello" } }),
      });

      const response = await POST(request, { params: Promise.resolve({ projectId: "proj-1" }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.runId).toBe("run_test123");
      expect(data.token).toBe("pub_token_xyz");
      expect(mockTrigger).toHaveBeenCalledWith("streaming-chat-task", expect.objectContaining({
        projectId: "proj-1",
        userPlan: "FREE",
      }));
      expect(mockCreatePublicToken).toHaveBeenCalledWith(expect.objectContaining({
        scopes: { read: { runs: ["run_test123"] } },
      }));
    });

    it("should return 500 if Trigger.dev fails to trigger", async () => {
      vi.mocked(requireAuth).mockResolvedValue({ id: "user-1", email: "test@test.com", role: "USER", plan: "FREE" } as any);
      vi.mocked(appendConversationMessage).mockResolvedValue([{ role: "user", content: "hello" } as any]);
      vi.mocked(db.conversation.findUnique).mockResolvedValue(null);
      mockTrigger.mockRejectedValue(new Error("Trigger.dev unavailable"));

      const request = new Request("http://localhost/api/conversations/proj-1/chat", {
        method: "POST",
        body: JSON.stringify({ message: { content: "hello" } }),
      });

      const response = await POST(request, { params: Promise.resolve({ projectId: "proj-1" }) });

      expect(response.status).toBe(500);
    });

    it("should pass conversationId when structured conversation exists", async () => {
      vi.mocked(requireAuth).mockResolvedValue({ id: "user-1", email: "test@test.com", role: "USER", plan: "FREE" } as any);
      vi.mocked(appendConversationMessage).mockResolvedValue([{ role: "user", content: "hello" } as any]);
      vi.mocked(db.conversation.findUnique).mockResolvedValue({ id: "conv-1" } as any);
      vi.mocked(db.conversationMessage.create).mockResolvedValue({ id: "msg-1" } as any);

      const request = new Request("http://localhost/api/conversations/proj-1/chat", {
        method: "POST",
        body: JSON.stringify({ message: { content: "hello" } }),
      });

      const response = await POST(request, { params: Promise.resolve({ projectId: "proj-1" }) });

      expect(response.status).toBe(200);
      expect(mockTrigger).toHaveBeenCalledWith("streaming-chat-task", expect.objectContaining({
        conversationId: "conv-1",
      }));
    });

    it("should still trigger task even if structured user-message persistence fails", async () => {
      vi.mocked(requireAuth).mockResolvedValue({ id: "user-1", email: "test@test.com", role: "USER", plan: "FREE" } as any);
      vi.mocked(appendConversationMessage).mockResolvedValue([{ role: "user", content: "hello" } as any]);
      vi.mocked(db.conversation.findUnique).mockResolvedValue({ id: "conv-1" } as any);
      vi.mocked(db.conversationMessage.create).mockRejectedValue(new Error("DB error"));

      const request = new Request("http://localhost/api/conversations/proj-1/chat", {
        method: "POST",
        body: JSON.stringify({ message: { content: "hello" } }),
      });

      const response = await POST(request, { params: Promise.resolve({ projectId: "proj-1" }) });

      // Should succeed — structured persistence failure is best-effort
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.runId).toBe("run_test123");
    });
  });
});
