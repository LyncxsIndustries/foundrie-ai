/**
 * Shared types for Trigger.dev tasks
 * Separated to avoid circular dependencies and improve import performance
 */

export interface GenerateZipPayload {
  projectId: string;
  userId: string;
}

export interface GenerateZipResult {
  fileName: string;
  url: string;
  size: number;
}

export interface ZipBuildOptions {
  onProgress?: (step: string, percent: number) => void;
}
