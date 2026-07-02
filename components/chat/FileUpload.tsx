'use client';

// File upload component with drag-and-drop (Feature 54).
// Integrates with Cloudinary for secure media storage.

import { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface AttachmentMetadata {
  cloudinaryId: string;
  cloudinaryUrl: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  type: 'image' | 'document' | 'video';
  width?: number;
  height?: number;
}

interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
}

interface FileUploadProps {
  projectId: string;
  onUploadComplete: (metadata: AttachmentMetadata) => void;
  onCancel?: () => void;
  maxSizeMB?: number;
  accept?: Record<string, string[]>;
}

export function FileUpload({
  projectId,
  onUploadComplete,
  onCancel,
  maxSizeMB = 10,
  accept = {
    'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt'],
    'text/markdown': ['.md'],
    'video/mp4': ['.mp4'],
    'video/webm': ['.webm'],
    'video/quicktime': ['.mov'],
  },
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setError(null);

      // Validate size
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File too large. Max size: ${maxSizeMB}MB`);
        return;
      }

      setUploading(true);
      setProgress(10);

      try {
        // Get upload signature from API
        const sigResponse = await fetch('/api/media/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId }),
        });

        if (!sigResponse.ok) {
          throw new Error('Failed to get upload signature');
        }

        const { signature, timestamp, cloudName, apiKey, folder } = await sigResponse.json();
        setProgress(20);

        // Upload to Cloudinary with XMLHttpRequest for real progress tracking
        const formData = new FormData();
        formData.append('file', file);
        formData.append('signature', signature);
        formData.append('timestamp', timestamp.toString());
        formData.append('api_key', apiKey);
        formData.append('folder', folder);

        const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

        // Use XMLHttpRequest for upload progress events
        const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhrRef.current = xhr;
          
          xhr.timeout = 30000; // 30s upload timeout

          xhr.addEventListener('timeout', () => {
            reject(new Error('Upload timed out'));
          });

          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const percentComplete = Math.round((e.loaded / e.total) * 80) + 20; // 20-100%
              setProgress(percentComplete);
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                resolve(JSON.parse(xhr.responseText));
              } catch (e) {
                reject(new Error('Invalid response from Cloudinary'));
              }
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'));
          });

          xhr.addEventListener('abort', () => {
            reject(new Error('Upload cancelled'));
          });

          xhr.open('POST', uploadUrl);
          xhr.send(formData);
        });

        setProgress(100);

        // Determine attachment type
        const type = file.type.startsWith('image/')
          ? 'image'
          : file.type.startsWith('video/')
            ? 'video'
            : 'document';

        const metadata: AttachmentMetadata = {
          cloudinaryId: result.public_id,
          cloudinaryUrl: result.secure_url,
          originalName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          type,
          width: result.width,
          height: result.height,
        };

        onUploadComplete(metadata);
      } catch (err) {
        console.error('Upload failed:', err);
        setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      } finally {
        xhrRef.current = null;
        setUploading(false);
        setProgress(0);
      }
    },
    [projectId, maxSizeMB, onUploadComplete]
  );

  const handleCancel = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
    }
    if (onCancel) {
      onCancel();
    }
  };

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
    multiple: false,
    disabled: uploading,
    onDropRejected: (rejections) => {
      const rejection = rejections[0];
      if (!rejection) return;

      const errors = rejection.errors.map(e => e.message).join(', ');
      setError(`File rejected: ${errors}`);
    },
  });

  return (
    <div className="border border-border rounded-lg p-4 bg-surface">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors
          ${isDragActive ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50'}
          ${uploading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3 text-center">
          {uploading ? (
            <>
              <Upload className="h-10 w-10 animate-bounce text-accent" />
              <div className="w-full max-w-xs">
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-muted mt-2">Uploading... {progress}%</p>
              </div>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted" />
              <div>
                <p className="text-sm text-text">
                  {isDragActive ? 'Drop file here' : 'Click or drag file to upload'}
                </p>
                <p className="text-xs text-muted mt-1">
                  Images, PDFs, videos, docs (max {maxSizeMB}MB)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {onCancel && (
        <div className="mt-3 flex justify-end">
          <Button variant="ghost" size="sm" onClick={handleCancel} disabled={!uploading && !onCancel}>
            {uploading ? 'Cancel Upload' : 'Cancel'}
          </Button>
        </div>
      )}
    </div>
  );
}
