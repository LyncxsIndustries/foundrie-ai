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
    sizeBytes: number;
    width?: number;
    height?: number;
  }>;
}

interface ChatMessageListProps {
  messages: Message[];
  projectId: string;
}

export function ChatMessageList({ messages, projectId }: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const prevMessageCountRef = useRef(messages.length);
  const prevLastContentRef = useRef('');

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

    if ((newMessageAdded || contentChanged) && isAtBottom) {
      // Small delay to ensure DOM has updated
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [messages, isAtBottom]);

  // Initial scroll to bottom
  useEffect(() => {
    scrollToBottom(false);
  }, []);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 50;
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

  return (
    <div className="flex-1 relative overflow-hidden">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-6 py-4 space-y-4"
      >
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
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
