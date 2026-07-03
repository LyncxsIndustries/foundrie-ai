/**
 * Shared type definitions for media/research asset handling
 */

export interface MediaFile {
  id: string;
  fileName: string;
  storageUrl: string;
  mimeType?: string | null;
  category?: string | null;
  tags?: string[];
  aiDescription?: string | null;
  fileSize?: number | null;
  createdAt: Date | string; // Can be Date object or ISO string from API
}
