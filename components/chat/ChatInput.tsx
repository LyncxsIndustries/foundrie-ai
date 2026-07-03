'use client';

// Enhanced chat input with file upload (Feature 54).
// Sticky at bottom with multi-line textarea and attachment support.

import { useState, useRef, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Send, X } from 'lucide-react';
import { FileUpload, AttachmentMetadata } from './FileUpload';
import { MediaPreview } from './MediaPreview';

interface ChatInputProps {
  projectId: string;
  onSend: (content: string, attachments: AttachmentMetadata[]) => Promise<void>;
  disabled?: boolean;
}

export function ChatInput({ projectId, onSend, disabled }: ChatInputProps) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<AttachmentMetadata[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!content.trim() && attachments.length === 0) return;
    if (sending || disabled) return;

    setSending(true);

    try {
      await onSend(content, attachments);
      setContent('');
      setAttachments([]);
      setShowUpload(false);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // Auto-resize textarea up to 5 lines
    const textarea = e.target;
    textarea.style.height = 'auto';
    const lineHeight = 24; // approximate line height
    const maxHeight = lineHeight * 5;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  };

  return (
    <div className="border-t border-border p-4 flex-shrink-0 bg-surface">
      {/* Upload Area */}
      {showUpload && (
        <div className="mb-4">
          <FileUpload
            projectId={projectId}
            onUploadComplete={(metadata) => {
              setAttachments(prev => [...prev, metadata]);
              setShowUpload(false);
            }}
            onCancel={() => setShowUpload(false)}
          />
        </div>
      )}

      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {attachments.map((att) => (
            <MediaPreview
              key={att.cloudinaryId}
              attachment={att}
              size="sm"
              onRemove={() => setAttachments(prev => prev.filter((a) => a.cloudinaryId !== att.cloudinaryId))}
            />
          ))}
        </div>
      )}

      {/* Input Row */}
      <div className="flex gap-2 items-end">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowUpload(!showUpload)}
          className="flex-shrink-0"
          disabled={disabled || sending}
          aria-label="Attach file"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (Cmd/Ctrl+Enter to send)"
          className="flex-1 min-h-[48px] max-h-[200px] resize-none"
          rows={1}
          disabled={disabled || sending}
        />

        <Button
          onClick={handleSend}
          disabled={sending || disabled || (!content.trim() && attachments.length === 0)}
          size="icon"
          className="flex-shrink-0 bg-accent hover:bg-accent/90"
          aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>

      <p className="text-xs text-muted mt-2">
        {sending ? (
          'Sending...'
        ) : (
          <>
            Cmd/Ctrl+Enter to send •{' '}
            {attachments.length > 0
              ? `${attachments.length} file(s) attached`
              : 'Upload images, PDFs, or documents'}
          </>
        )}
      </p>
    </div>
  );
}
