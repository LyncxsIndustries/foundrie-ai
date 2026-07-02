'use client';

// Enhanced discovery chat with file upload and fixed scrolling (Feature 54).
// Complete redesign using ConversationMessage model and Cloudinary attachments.

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import type { AttachmentMetadata } from './FileUpload';

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

export function DiscoveryChat({ projectId }: DiscoveryChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);

  // Load existing messages
  useEffect(() => {
    fetch(`/api/conversations/${projectId}/messages`)
      .then((res) => res.json())
      .then((data) => {
        // Normalize dates to strings
        const normalized = (data.messages || []).map((msg: Message) => ({
          ...msg,
          createdAt: typeof msg.createdAt === 'string' ? msg.createdAt : new Date(msg.createdAt).toISOString(),
        }));
        setMessages(normalized);
      })
      .catch((err) => console.error('Failed to load messages:', err))
      .finally(() => setIsLoading(false));
  }, [projectId]);

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

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let text = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          text += decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((m) => (m.id === streamMessageId ? { ...m, content: text } : m))
          );
        }
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamMessageId
            ? { ...m, content: 'Error: Could not fetch response.' }
            : m
        )
      );
    } finally {
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
      <ChatMessageList messages={messages} projectId={projectId} />
      <ChatInput projectId={projectId} onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}
