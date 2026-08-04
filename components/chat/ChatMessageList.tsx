'use client';

// Chat message list with auto-scroll (Feature 54).
// Only this area scrolls; sidebar and header remain fixed.

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';
import { ChatMessage } from './ChatMessage';

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

interface ChatMessageListProps {
  messages: Message[];
  projectId: string;
  activeRun?: any;
  activeRunMessageId?: string | null;
  /** True while the AI task is triggered but no stream content has arrived yet. */
  isWaitingForStream?: boolean;
  onAction?: (action: string, message: Message, newContent?: string) => void;
}

export function ChatMessageList({ 
  messages, 
  projectId,
  activeRun,
  activeRunMessageId,
  isWaitingForStream,
  onAction,
}: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const prevMessageCountRef = useRef(messages.length);
  const prevLastContentRef = useRef('');

  // Track mounted state to prevent hydration mismatch with locale-dependent dates
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const scrollToBottom = (smooth = true) => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  // Auto-scroll on new message or streaming content if user is at bottom
  useEffect(() => {
    const newMessageAdded = messages.length > prevMessageCountRef.current;
    const lastMessage = messages[messages.length - 1];
    const lastContent = lastMessage?.content || '';
    const contentChanged = lastContent !== prevLastContentRef.current;
    
    prevMessageCountRef.current = messages.length;
    prevLastContentRef.current = lastContent;

    // Force scroll if we're waiting for stream to start, or if new message is added, or if content changed while at bottom
    const shouldScroll = newMessageAdded || isWaitingForStream || (contentChanged && isAtBottom);

    if (shouldScroll) {
      // Small delay to ensure DOM has updated
      const timerId = setTimeout(() => {
        scrollToBottom();
        // Also force isAtBottom to true if we programmatically scrolled
        setIsAtBottom(true);
        setShowScrollButton(false);
      }, 100);
      
      return () => clearTimeout(timerId);
    }
  }, [messages, isAtBottom, isWaitingForStream]);

  // Initial scroll to bottom
  useEffect(() => {
    scrollToBottom(false);
  }, []);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // 150px tolerance for auto-scrolling
    const atBottom = scrollHeight - scrollTop - clientHeight < 150;
    setIsAtBottom(atBottom);
    setShowScrollButton(!atBottom);
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <p className="text-muted mb-2">No messages yet</p>
          <p className="text-sm text-muted">
            Start the conversation by typing a message below
          </p>
        </div>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages: { dateLabel: string; messages: Message[] }[] = [];
  let currentGroup: { dateLabel: string; messages: Message[] } | null = null;

  const formatDateLabel = (dateStr: string) => {
    // Use ISO date (YYYY-MM-DD) as stable server-side key
    const date = new Date(dateStr);
    const isoDate = date.toISOString().split('T')[0];
    
    // After mount, use client-local formatting
    if (isMounted) {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
      }
    }
    
    // Server-side: return ISO date as fallback (will be replaced on client)
    return isoDate;
  };

  messages.forEach((msg) => {
    const dateLabel = formatDateLabel(msg.createdAt);
    if (!currentGroup || currentGroup.dateLabel !== dateLabel) {
      currentGroup = { dateLabel, messages: [] };
      groupedMessages.push(currentGroup);
    }
    currentGroup.messages.push(msg);
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-6"
      >
        {groupedMessages.map((group) => (
          <div key={group.dateLabel} className="space-y-4">
            <div className="flex justify-center my-6">
              <span className="text-[11px] uppercase tracking-wider font-semibold bg-bg-surface/50 text-text-secondary px-4 py-1.5 rounded-full border border-border/50 shadow-sm backdrop-blur-md">
                {group.dateLabel}
              </span>
            </div>
            {group.messages.map((message) => (
              <ChatMessage 
                key={message.id} 
                message={message} 
                activeRun={activeRunMessageId === message.id ? activeRun : null}
                isWaitingForStream={activeRunMessageId === message.id ? isWaitingForStream : false}
                onAction={onAction}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <Button
          onClick={() => scrollToBottom()}
          size="icon"
          className="absolute bottom-4 right-4 rounded-full shadow-lg bg-accent hover:bg-accent/90"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
