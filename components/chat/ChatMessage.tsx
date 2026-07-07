import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Bot, User, FileText, File as FileIcon, ChevronDown, ChevronRight, Brain, Loader2, Sparkles, Zap, Search, MessageSquare, Copy, Pencil, Trash, Reply, RotateCcw, Check, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { ChatMessage as ChatMessageType } from '@/lib/conversations/chat';
import ReactMarkdown from 'react-markdown';
import { formatFileSize } from '@/lib/format';

interface ChatMessageProps {
  message: ChatMessageType & {
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
  };
  activeRun?: any;
  /** True while the Trigger.dev task is running but no stream content has arrived yet. */
  isWaitingForStream?: boolean;
  onAction?: (action: string, message: any, newContent?: string) => void;
}

// ---------------------------------------------------------------------------
// Simulated agent phases — shown before the AI stream starts delivering text.
// These give the user a sense of progress even though the AI is working
// asynchronously in a Trigger.dev task.
// ---------------------------------------------------------------------------
const AGENT_PHASES = [
  { label: 'Queueing task…', icon: Zap, durationMs: 2000 },
  { label: 'Analyzing your message…', icon: Search, durationMs: 3000 },
  { label: 'Gathering conversation context…', icon: MessageSquare, durationMs: 4000 },
  { label: 'Connecting to AI engine…', icon: Sparkles, durationMs: 3500 },
  { label: 'Thinking deeply…', icon: Brain, durationMs: 0 /* stays here until content arrives */ },
];

export const ChatMessage = React.memo(function ChatMessage({
  message,
  activeRun,
  isWaitingForStream,
  onAction,
}: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [isLogsExpanded, setIsLogsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  // ---- <think> tag parsing (DeepSeek R1 reasoning) ----
  const thinkStart = message.content.indexOf('<think>');
  let displayContent = message.content;
  let thinkingContent = null;
  let isThinkingFinished = true;

  if (thinkStart !== -1) {
    const thinkEnd = message.content.indexOf('</think>');
    if (thinkEnd !== -1) {
      thinkingContent = message.content.substring(thinkStart + 7, thinkEnd).trim();
      displayContent = message.content.substring(0, thinkStart) + message.content.substring(thinkEnd + 8);
    } else {
      thinkingContent = message.content.substring(thinkStart + 7).trim();
      displayContent = message.content.substring(0, thinkStart);
      isThinkingFinished = false;
    }
  }

  const [isExpanded, setIsExpanded] = useState(!isThinkingFinished);

  useEffect(() => {
    if (!isThinkingFinished) {
      setIsExpanded(true);
    } else if (thinkingContent) {
      setIsExpanded(false);
    }
  }, [isThinkingFinished, thinkingContent !== null]);

  // ---- Agent phase animation (before streaming starts) ----
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [phaseStartTime] = useState(() => Date.now());

  useEffect(() => {
    if (!isWaitingForStream) {
      setCurrentPhaseIndex(0);
      if (phaseTimerRef.current) {
        clearTimeout(phaseTimerRef.current);
        phaseTimerRef.current = null;
      }
      return;
    }

    // Advance through phases on a timer
    const advancePhase = (index: number) => {
      if (index >= AGENT_PHASES.length - 1) return; // Stay on last phase
      const phase = AGENT_PHASES[index];
      if (phase.durationMs > 0) {
        phaseTimerRef.current = setTimeout(() => {
          setCurrentPhaseIndex(index + 1);
          advancePhase(index + 1);
        }, phase.durationMs);
      }
    };

    advancePhase(currentPhaseIndex);

    return () => {
      if (phaseTimerRef.current) {
        clearTimeout(phaseTimerRef.current);
      }
    };
  }, [isWaitingForStream]);

  // ---- Trigger.dev run metadata (enhanced engine status) ----
  const renderEngineLogs = () => {
    if (!activeRun) return null;
    
    const runStatus = activeRun.status;
    const runMetadata = activeRun.metadata || {};
    const runStatusText = runMetadata.status;
    const runLogs: string[] = runMetadata.logs || [];
    
    const isQueued = runStatus === 'QUEUED';
    const statusLabel = runStatusText || (isQueued ? 'Queueing in Trigger.dev…' : 'Agent running…');

    return (
      <div className="rounded-lg border border-accent-primary/20 bg-accent-primary-dim p-3 mb-3 text-xs w-full max-w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-accent-primary">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="font-semibold tracking-wide uppercase">Foundrie Agent Engine</span>
            <span className="text-[10px] text-muted-foreground bg-surface-secondary px-1.5 py-0.5 rounded uppercase font-mono">{runStatus || 'RUNNING'}</span>
          </div>
          <button 
            onClick={() => setIsLogsExpanded(!isLogsExpanded)}
            className="text-[10px] text-accent-primary/80 hover:text-accent-primary underline select-none font-medium"
          >
            {isLogsExpanded ? 'Hide details' : 'Show details'}
          </button>
        </div>
        
        <div className="mt-1.5 text-text-primary/95 font-medium">
          {statusLabel}
        </div>

        {isLogsExpanded && runLogs.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-border-default/50 space-y-1.5 max-h-40 overflow-y-auto font-mono text-[10px] text-text-secondary">
            {runLogs.map((log: string, index: number) => {
              const isLast = index === runLogs.length - 1;
              return (
                <div key={index} className="flex items-start gap-1.5 leading-normal">
                  <span className={cn(
                    "inline-block w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                    isLast ? "bg-accent-primary animate-pulse" : "bg-text-muted/60"
                  )} />
                  <span className={isLast ? "text-accent-primary font-medium" : ""}>{log}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ---- Agent thinking indicator (shown before stream delivers content) ----
  const renderAgentThinking = () => {
    if (!isWaitingForStream) return null;

    const currentPhase = AGENT_PHASES[currentPhaseIndex];
    const PhaseIcon = currentPhase.icon;
    const elapsed = Math.round((Date.now() - phaseStartTime) / 1000);

    return (
      <div className="w-full max-w-full">
        {/* Main status card */}
        <div className="rounded-lg border border-accent-primary/30 bg-gradient-to-br from-accent-primary/[0.06] to-accent-primary/[0.02] p-4 mb-2">
          {/* Header */}
          <div className="flex items-center gap-2.5 mb-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-accent-primary/15 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-accent-primary" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-accent-primary animate-pulse border-2 border-background" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Foundrie is thinking</p>
              <p className="text-[10px] text-text-muted font-mono">{elapsed}s elapsed</p>
            </div>
          </div>

          {/* Phase progress */}
          <div className="space-y-1.5">
            {AGENT_PHASES.map((phase, index) => {
              const isActive = index === currentPhaseIndex;
              const isComplete = index < currentPhaseIndex;
              const isPending = index > currentPhaseIndex;
              const IconComponent = phase.icon;

              return (
                <div
                  key={phase.label}
                  className={cn(
                    "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-all duration-300",
                    isActive && "bg-accent-primary/10 text-accent-primary font-medium",
                    isComplete && "text-text-muted",
                    isPending && "text-text-muted/40"
                  )}
                >
                  {/* Status indicator */}
                  {isComplete && (
                    <svg className="w-3.5 h-3.5 text-accent-primary shrink-0" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {isActive && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  )}
                  {isPending && (
                    <div className="w-3.5 h-3.5 rounded-full border border-current shrink-0 opacity-40" />
                  )}
                  <span>{phase.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subtle bottom hint */}
        <p className="text-[10px] text-text-muted/60 text-center italic">
          This may take 15–60 seconds depending on complexity
        </p>
      </div>
    );
  };

  // ---- Attachment rendering ----
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

    // Document attachment - use mimeType for reliable PDF detection
    const icon = attachment.mimeType === 'application/pdf' ? (
      <FileText className="h-5 w-5" />
    ) : (
      <FileIcon className="h-5 w-5" />
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
            {formatFileSize(attachment.sizeBytes)}
          </p>
        </div>
      </a>
    );
  };

  // ---- Render ----
  return (
    <div
      className={cn(
        'group flex w-full items-start gap-4 py-4',
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
        {/* Engine logs from Trigger.dev metadata */}
        {activeRun && renderEngineLogs()}

        {/* Agent thinking phases (pre-stream) */}
        {renderAgentThinking()}

        {/* Collapsible thinking block (DeepSeek R1 <think> tags) */}
        {thinkingContent && (
          <div className="rounded-lg border border-border/50 bg-background/50 overflow-hidden mb-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface-secondary/50 transition-colors select-none"
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <Brain className="w-3.5 h-3.5" />
              <span>{isThinkingFinished ? 'Thought Process' : 'Thinking…'}</span>
              {!isThinkingFinished && (
                <Loader2 className="w-3 h-3 animate-spin ml-auto text-accent-primary" />
              )}
            </button>
            {isExpanded && (
              <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border/50 bg-background/30 prose prose-sm dark:prose-invert break-words max-h-96 overflow-y-auto">
                <ReactMarkdown>{thinkingContent}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Main content */}
        {isEditing ? (
          <Textarea 
            value={editContent} 
            onChange={(e) => setEditContent(e.target.value)} 
            className="min-h-[100px] text-sm mt-2 text-foreground"
            autoFocus
          />
        ) : displayContent.trim() && (
          <div className="prose prose-sm dark:prose-invert break-words">
            <ReactMarkdown>{displayContent}</ReactMarkdown>
          </div>
        )}
        
        {/* Bouncing dots fallback — shown only when there's no content AND no
            thinking indicator (i.e. a brief moment before the phase UI kicks in) */}
        {(!displayContent.trim() && !thinkingContent && !isUser && !isWaitingForStream && !activeRun) && (
          <div className="flex items-center gap-1.5 text-muted-foreground h-5">
            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}

        {/* Render attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="space-y-2">
            {message.attachments.map((attachment) => (
              <div key={attachment.id}>{renderAttachment(attachment)}</div>
            ))}
          </div>
        )}
      </div>
      
      {/* Action Menu (hover) */}
      {!isWaitingForStream && !activeRun && (
        <div className={cn(
          "opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1",
          isUser ? "flex-row-reverse mr-2" : "ml-2"
        )}>
          {isEditing ? (
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                onAction?.('edit', message, editContent);
                setIsEditing(false);
              }}>
                <Check className="h-3.5 w-3.5 text-green-500" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                setIsEditing(false);
                setEditContent(message.content);
              }}>
                <X className="h-3.5 w-3.5 text-red-500" />
              </Button>
            </div>
          ) : (
            <div className={cn("flex gap-1", isUser ? "flex-row-reverse" : "flex-row")}>
              <Button size="icon" variant="ghost" className="h-6 w-6" title="Reply" onClick={() => onAction?.('reply', message)}>
                <Reply className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6" title="Copy" onClick={() => onAction?.('copy', message)}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6" title="Edit" onClick={() => setIsEditing(true)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {isUser ? (
                <Button size="icon" variant="ghost" className="h-6 w-6" title="Rollback" onClick={() => onAction?.('rollback', message)}>
                  <RotateCcw className="h-3.5 w-3.5 text-amber-500" />
                </Button>
              ) : (
                <Button size="icon" variant="ghost" className="h-6 w-6" title="Regenerate" onClick={() => onAction?.('regenerate', message)}>
                  <RotateCcw className="h-3.5 w-3.5 text-amber-500" />
                </Button>
              )}
              <Button size="icon" variant="ghost" className="h-6 w-6" title="Delete" onClick={() => onAction?.('delete', message)}>
                <Trash className="h-3.5 w-3.5 text-red-500" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
