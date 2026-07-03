// Cloudinary upload utilities (Feature 54).
// Provides signature generation for secure uploads and URL optimization.

import { cloudinary } from './client';

/**
 * Determine media type subfolder based on MIME type.
 */
function getMediaTypeFolder(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'images';
  if (mimeType.startsWith('video/')) return 'videos';
  if (mimeType === 'text/markdown') return 'markdown';
  // PDFs, Word docs, text files, etc.
  return 'documents';
}

/**
 * Generate upload signature for secure client-side uploads.
 * Returns signature and required parameters for Cloudinary upload.
 * 
 * Folder structure: Foundrie AI Files/{projectId}/{mediaType}/
 */
export async function generateUploadSignature(
  projectId: string,
  mimeType?: string
) {
  const timestamp = Math.round(Date.now() / 1000);
  
  // Organize files by project and media type
  // If mimeType is provided, use specific subfolder; otherwise use root project folder
  let folder = `Foundrie AI Files/${projectId}`;
  if (mimeType) {
    const mediaTypeFolder = getMediaTypeFolder(mimeType);
    folder = `${folder}/${mediaTypeFolder}`;
  }

  // Validate required environment variable
  if (!process.env.CLOUDINARY_API_SECRET) {
    throw new Error('CLOUDINARY_API_SECRET is not configured');
  }

  const paramsToSign = {
    timestamp,
    folder,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder,
  };
}

/**
 * Get optimized image URL from Cloudinary public_id.
 * Applies automatic format selection and quality optimization.
 */
export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: 'auto' | number;
  } = {}
): string {
  const { width = 800, height, quality = 'auto' } = options;

  return cloudinary.url(publicId, {
    transformation: [
      { width, height, crop: 'limit' },
      { quality },
      { fetch_format: 'auto' },
    ],
  });
}

/**
 * Get thumbnail URL for media preview.
 */
export function getThumbnailUrl(publicId: string, size: number = 200): string {
  return cloudinary.url(publicId, {
    transformation: [
      { width: size, height: size, crop: 'fill', gravity: 'auto' },
      { quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  });
}
