'use client';

// Media preview component for attachments (Feature 54).
// Displays thumbnails and file info for uploaded media.

import { X, File, FileText, FileVideo, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AttachmentMetadata } from './FileUpload';
import { formatFileSize } from '@/lib/format';

interface MediaPreviewProps {
  attachment: AttachmentMetadata;
  onRemove?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function MediaPreview({ attachment, onRemove, size = 'md' }: MediaPreviewProps) {
  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
  };

  const iconSize = size === 'sm' ? 'h-6 w-6' : size === 'md' ? 'h-8 w-8' : 'h-10 w-10';

  const getFileIcon = () => {
    switch (attachment.type) {
      case 'image':
        return <ImageIcon className={iconSize} />;
      case 'video':
        return <FileVideo className={iconSize} />;
      case 'document':
        return attachment.mimeType === 'application/pdf' ? (
          <FileText className={iconSize} />
        ) : (
          <File className={iconSize} />
        );
      default:
        return <File className={iconSize} />;
    }
  };

  return (
    <div className="relative group">
      <div
        className={`
          ${sizeClasses[size]} rounded-lg border border-border overflow-hidden
          bg-surface-secondary flex items-center justify-center
        `}
      >
        {attachment.type === 'image' ? (
          <img
            src={attachment.cloudinaryUrl}
            alt={attachment.originalName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-2 text-center">
            {getFileIcon()}
          </div>
        )}
      </div>

      {/* File info overlay */}
      <div className="mt-1 text-xs text-muted truncate max-w-[120px]">
        <p className="truncate">{attachment.originalName}</p>
        <p>{formatFileSize(attachment.sizeBytes)}</p>
      </div>

      {/* Remove button */}
      {onRemove && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onRemove}
          aria-label={`Remove ${attachment.originalName}`}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
