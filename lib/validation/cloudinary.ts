/**
 * SSRF Protection for Cloudinary URLs
 * Validates attachment URLs before persistence and fetching
 */

const ALLOWED_CLOUDINARY_HOSTS = [
  'res.cloudinary.com',
  'cloudinary.com',
];

const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Videos
  'video/mp4',
  'video/webm',
  'video/quicktime',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/markdown',
  'text/plain',
];

// 50MB limit for attachments
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export interface CloudinaryValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a Cloudinary URL for SSRF protection
 * Checks: HTTPS protocol, allowed host, valid URL structure
 */
export function validateCloudinaryUrl(url: string): CloudinaryValidationResult {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required and must be a string' };
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  // Require HTTPS
  if (parsedUrl.protocol !== 'https:') {
    return { valid: false, error: 'URL must use HTTPS protocol' };
  }

  // Check allowed Cloudinary hosts
  const isAllowedHost = ALLOWED_CLOUDINARY_HOSTS.some(
    host => parsedUrl.hostname === host || parsedUrl.hostname.endsWith(`.${host}`)
  );

  if (!isAllowedHost) {
    return { 
      valid: false, 
      error: `URL must be from an allowed Cloudinary host: ${ALLOWED_CLOUDINARY_HOSTS.join(', ')}` 
    };
  }

  // Cloudinary URLs should have a valid path structure
  // Example: /v1234567890/folder/file.jpg
  if (!parsedUrl.pathname || parsedUrl.pathname === '/') {
    return { valid: false, error: 'Cloudinary URL must have a valid resource path' };
  }

  return { valid: true };
}

/**
 * Validates attachment metadata (MIME type, size)
 */
export function validateAttachmentMetadata(
  mimeType: string,
  sizeBytes: number
): CloudinaryValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return { 
      valid: false, 
      error: `MIME type ${mimeType} is not allowed` 
    };
  }

  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    return { 
      valid: false, 
      error: `File size ${sizeBytes} bytes exceeds maximum of ${MAX_FILE_SIZE_BYTES} bytes (50MB)` 
    };
  }

  if (sizeBytes < 0) {
    return { valid: false, error: 'File size must be non-negative' };
  }

  return { valid: true };
}

/**
 * Validates a complete attachment before persistence
 */
export interface AttachmentValidation {
  cloudinaryUrl: string;
  mimeType: string;
  sizeBytes: number;
}

export function validateAttachment(
  attachment: AttachmentValidation
): CloudinaryValidationResult {
  // Validate URL
  const urlResult = validateCloudinaryUrl(attachment.cloudinaryUrl);
  if (!urlResult.valid) {
    return urlResult;
  }

  // Validate metadata
  const metadataResult = validateAttachmentMetadata(
    attachment.mimeType,
    attachment.sizeBytes
  );
  if (!metadataResult.valid) {
    return metadataResult;
  }

  return { valid: true };
}
