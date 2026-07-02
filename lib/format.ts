/**
 * File formatting utilities (Feature 54).
 * Shared helpers for consistent file size and media display formatting.
 */

/**
 * Format bytes to human-readable file size.
 * Returns B, KB, or MB depending on magnitude.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
