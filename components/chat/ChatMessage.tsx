import React from 'react';
import { cn } from '@/lib/utils';
import { Bot, User, FileText, FileVideo, Image as ImageIcon } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '@/lib/conversations/chat';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: ChatMessageType & {
    attachments?: Array<{
      id: string;
      type: 'image' | 'document' | 'video';
      cloudinaryUrl: string;
      originalName: string;
      sizeBytes: number;
      width?: number;
      height?: number;
    }>;
  };
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === 'user';

  const renderAttachment = (attachment: NonNullable<ChatMessageProps['message']['attachments']>[0]) => {
    if (attachment.type === 'image') {
      return (
        <a
          href={attachment.cloudinaryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-2 rounded-lg overflow-hidden border border-border hover:opacity-90 transition-opacity"
        >
          <img
            src={attachment.cloudinaryUrl}
            alt={attachment.originalName}
            className="max-w-full h-auto max-h-[400px] object-contain"
          />
        </a>
      );
    }

    if (attachment.type === 'video') {
      return (
        <div className="mt-2 rounded-lg overflow-hidden border border-border">
          <video
            src={attachment.cloudinaryUrl}
            controls
            className="max-w-full h-auto max-h-[400px]"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    // Document attachment
    const icon = attachment.originalName.endsWith('.pdf') ? (
      <FileText className="h-5 w-5" />
    ) : (
      <FileVideo className="h-5 w-5" />
    );

    return (
      <a
        href={attachment.cloudinaryUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-surface-secondary transition-colors"
      >
        {icon}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{attachment.originalName}</p>
          <p className="text-xs text-muted">
            {(attachment.sizeBytes / 1024).toFixed(1)} KB
          </p>
        </div>
      </a>
    );
  };

  return (
    <div
      className={cn(
        'flex w-full items-start gap-4 py-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow-sm',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          'flex min-w-[120px] max-w-[80%] flex-col gap-2 rounded-lg px-4 py-3 text-sm',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
        )}
      >
        <div className="prose prose-sm dark:prose-invert break-words">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>

        {/* Render attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="space-y-2">
            {message.attachments.map((attachment) => (
              <div key={attachment.id}>{renderAttachment(attachment)}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
