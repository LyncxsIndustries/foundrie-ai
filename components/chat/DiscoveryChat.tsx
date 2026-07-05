'use client';

// Enhanced discovery chat with file upload, fixed scrolling, and real-time
// streaming via Trigger.dev (Feature 54 + engine-status UX improvements).
// The stream subscriber is isolated into a child component that only mounts
// when an active run exists, preventing the useRealtimeStream hook from
// crashing on SSR or when no run is active.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import type { AttachmentMetadata } from './FileUpload';
import { useRealtimeStream, useRealtimeRun } from "@trigger.dev/react-hooks";

interface DiscoveryChatProps {
  projectId: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  attachments?: Array<{
    id: string;
    type: 'image' | 'document' | 'video';
    cloudinaryUrl: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    width?: number;
    height?: number;
  }>;
}

// ---------------------------------------------------------------------------
// StreamSubscriber — Only mounts when there is an active run.
// This prevents `useRealtimeStream` from being called with empty/undefined
// values on SSR or when no AI run is in progress.
// ---------------------------------------------------------------------------
interface StreamSubscriberProps {
  runId: string;
  token: string;
  messageId: string;
  onStreamParts: (messageId: string, parts: string[]) => void;
  onRunUpdate: (run: any) => void;
  onStreamError: (messageId: string, error: Error) => void;
}

function StreamSubscriber({
  runId,
  token,
  messageId,
  onStreamParts,
  onRunUpdate,
  onStreamError,
}: StreamSubscriberProps) {
  const { parts, error: streamError } = useRealtimeStream(
    runId,
    "ai-chat-stream",
    {
      accessToken: token,
      throttleInMs: 50,
      enabled: true,
    }
  );

  const { run } = useRealtimeRun(runId, {
    accessToken: token,
    enabled: true,
  });

  // Forward stream parts to parent
  useEffect(() => {
    if (parts && parts.length > 0) {
      onStreamParts(messageId, parts as string[]);
    }
  }, [parts, messageId, onStreamParts]);

  // Forward run status to parent
  useEffect(() => {
    if (run) {
      onRunUpdate(run);
    }
  }, [run, onRunUpdate]);

  // Forward stream errors to parent
  useEffect(() => {
    if (streamError) {
      onStreamError(messageId, streamError);
    }
  }, [streamError, messageId, onStreamError]);

  return null; // This is a headless subscriber, no UI
}

// ---------------------------------------------------------------------------
// DiscoveryChat — Main chat container
// ---------------------------------------------------------------------------
export function DiscoveryChat({ projectId }: DiscoveryChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeRun, setActiveRun] = useState<{ runId: string; token: string; messageId: string } | null>(null);
  const [currentRun, setCurrentRun] = useState<any>(null);

  // Track whether we've received any stream content for the active run.
  // If the run completes without any content having streamed, we do a
  // server-side refetch to get the persisted AI message.
  const hasReceivedContentRef = useRef(false);

  // Timeout ref: if no stream content arrives within 90s after triggering,
  // assume the stream connection was lost and refetch from server.
  const streamTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- Callbacks for StreamSubscriber (stable references) ----

  const handleStreamParts = useCallback((messageId: string, parts: string[]) => {
    hasReceivedContentRef.current = true;
    // Clear the safety timeout since we got content
    if (streamTimeoutRef.current) {
      clearTimeout(streamTimeoutRef.current);
      streamTimeoutRef.current = null;
    }
    const text = parts.join("");
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, content: text } : m))
    );
  }, []);

  const handleRunUpdate = useCallback((run: any) => {
    setCurrentRun(run);
  }, []);

  const handleStreamError = useCallback((messageId: string, error: Error) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, content: 'Error: ' + error.message }
          : m
      )
    );
    setIsStreaming(false);
    setActiveRun(null);
    setCurrentRun(null);
    hasReceivedContentRef.current = false;
    if (streamTimeoutRef.current) {
      clearTimeout(streamTimeoutRef.current);
      streamTimeoutRef.current = null;
    }
  }, []);

  // ---- Handle run completion ----
  useEffect(() => {
    if (!currentRun || !activeRun) return;
    const status = currentRun.status;

    if (status === "COMPLETED" || status === "FAILED" || status === "CANCELED") {
      // If the run completed but we never received stream content,
      // the WebSocket might have disconnected. Refetch messages from the server
      // to pick up the AI response that was persisted by the task.
      if (!hasReceivedContentRef.current && status === "COMPLETED") {
        refetchMessages();
      }

      // If run FAILED/CANCELED and no content was received, show an error
      if (!hasReceivedContentRef.current && status !== "COMPLETED") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === activeRun.messageId
              ? { ...m, content: status === "FAILED" ? 'Error: AI generation failed. Please try again.' : 'The AI generation was canceled.' }
              : m
          )
        );
      }

      setIsStreaming(false);
      setActiveRun(null);
      setCurrentRun(null);
      hasReceivedContentRef.current = false;
      if (streamTimeoutRef.current) {
        clearTimeout(streamTimeoutRef.current);
        streamTimeoutRef.current = null;
      }
    }
  }, [currentRun?.status, activeRun]);

  // ---- Refetch messages from server (fallback for lost streams) ----
  const refetchMessages = useCallback(() => {
    fetch(`/api/conversations/${projectId}/messages`)
      .then((res) => res.json())
      .then((data) => {
        const normalized = (data.messages || []).map((msg: Message) => ({
          ...msg,
          createdAt: typeof msg.createdAt === 'string' ? msg.createdAt : new Date(msg.createdAt).toISOString(),
        }));
        setMessages(normalized);
      })
      .catch((err) => console.error('Failed to refetch messages:', err));
  }, [projectId]);

  // ---- Load existing messages ----
  useEffect(() => {
    fetch(`/api/conversations/${projectId}/messages`)
      .then((res) => res.json())
      .then((data) => {
        const normalized = (data.messages || []).map((msg: Message) => ({
          ...msg,
          createdAt: typeof msg.createdAt === 'string' ? msg.createdAt : new Date(msg.createdAt).toISOString(),
        }));
        setMessages(normalized);
      })
      .catch((err) => console.error('Failed to load messages:', err))
      .finally(() => setIsLoading(false));
  }, [projectId]);

  // ---- Cleanup timeout on unmount ----
  useEffect(() => {
    return () => {
      if (streamTimeoutRef.current) {
        clearTimeout(streamTimeoutRef.current);
      }
    };
  }, []);

  // ---- Send message ----
  const handleSend = async (content: string, attachments: AttachmentMetadata[]) => {
    if (!content.trim() && attachments.length === 0) return;

    // Add user message optimistically
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
      attachments: attachments.map((att) => ({
        id: crypto.randomUUID(),
        type: att.type,
        cloudinaryUrl: att.cloudinaryUrl,
        originalName: att.originalName,
        mimeType: att.mimeType,
        sizeBytes: att.sizeBytes,
        width: att.width,
        height: att.height,
      })),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);
    hasReceivedContentRef.current = false;

    // Add placeholder for assistant response
    const streamMessageId = crypto.randomUUID();
    const assistantMessage: Message = {
      id: streamMessageId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await fetch(`/api/conversations/${projectId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: {
            content,
            attachments: attachments.map((att) => ({
              type: att.type.toUpperCase(),
              cloudinaryId: att.cloudinaryId,
              cloudinaryUrl: att.cloudinaryUrl,
              originalName: att.originalName,
              mimeType: att.mimeType,
              sizeBytes: att.sizeBytes,
              width: att.width,
              height: att.height,
            })),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Chat request failed');
      }

      const data = await response.json();
      if (!data.runId || !data.token) {
        throw new Error('Missing run token from backend');
      }

      // Start listening to the Trigger.dev stream
      setActiveRun({ runId: data.runId, token: data.token, messageId: streamMessageId });

      // Safety timeout: if no content arrives in 120s, refetch from server.
      // This covers cases where the Trigger.dev WebSocket connection drops
      // silently (e.g., "Connection was lost: transport close").
      streamTimeoutRef.current = setTimeout(() => {
        if (!hasReceivedContentRef.current) {
          refetchMessages();
          setIsStreaming(false);
          setActiveRun(null);
          setCurrentRun(null);
        }
      }, 120_000);

    } catch (err) {
      console.error(err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamMessageId
            ? { ...m, content: 'Error: Could not trigger AI.' }
            : m
        )
      );
      setIsStreaming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Conditionally mount the stream subscriber only when there's an active run.
          This prevents useRealtimeStream from crashing with undefined values. */}
      {activeRun && (
        <StreamSubscriber
          runId={activeRun.runId}
          token={activeRun.token}
          messageId={activeRun.messageId}
          onStreamParts={handleStreamParts}
          onRunUpdate={handleRunUpdate}
          onStreamError={handleStreamError}
        />
      )}

      <ChatMessageList
        messages={messages}
        projectId={projectId}
        activeRun={currentRun}
        activeRunMessageId={activeRun?.messageId}
        isWaitingForStream={isStreaming && !hasReceivedContentRef.current}
      />
      <ChatInput projectId={projectId} onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}
