# Cloudinary Setup Guide (Feature 54)

## Overview

Foundrie uses Cloudinary for media storage in the discovery chat. This provides:
- 25GB free storage + 25GB bandwidth per month
- Automatic image optimization and responsive delivery
- Video support with transformations
- CDN-backed delivery
- Better economics than Vercel Blob for media-heavy use

## Account Setup

1. **Sign up for Cloudinary**
   - Visit https://cloudinary.com
   - Create a free account
   - No credit card required for free tier

2. **Get your credentials**
   - Navigate to Dashboard → Settings → Security
   - Copy the following values:
     - Cloud Name
     - API Key
     - API Secret

3. **Assign API Key Role (CRITICAL)**
   - New Cloudinary accounts use the Roles and Permissions system. Your API key will fail with a 403 error on uploads unless it is assigned a role.
   - Go to Settings (gear icon) → Role Management (or Access Keys).
   - Find your API Key.
   - Edit it and assign the **"Media Developer"** role (or any role that grants the `create` permission).
   - Save the changes. This takes effect immediately.

4. **Add to your environment**
   
   Add these variables to `.env.local`:
   
   ```env
   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=123456789012345
   CLOUDINARY_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   NEXT_PUBLIC_CLOUDINARY_API_KEY=123456789012345
   ```

## Usage

Media uploads are handled automatically through the chat interface:

1. Click the paperclip icon or drag files into the upload area
2. Supported file types:
   - **Images**: JPG, PNG, GIF, WEBP, SVG (max 10MB)
   - **Documents**: PDF, DOCX, TXT, MD (max 5MB)
   - **Videos**: MP4, WEBM, MOV (max 50MB)

3. Files are:
   - Validated client-side
   - Securely uploaded via signed URLs
   - Automatically optimized by Cloudinary
   - Stored in project-specific folders: `foundrie/{env}/{projectId}/`

## Architecture

- **Signature Generation**: Server-side only (`/api/media/upload`)
- **Upload Flow**: Client → Signature API → Cloudinary → Database
- **Storage Pattern**: URLs stored in PostgreSQL, binary data in Cloudinary
- **Organization**: Files organized by environment and project

## Free Tier Limits

- Storage: 25GB
- Bandwidth: 25GB/month
- Transformations: 25 credits/month
- Video: 500 minutes processing/month

Monitor usage at: https://cloudinary.com/console/usage

## Security

- Upload signatures generated server-side only
- Signatures expire after 1 hour
- File type validation on client and server
- Size limits enforced before upload
- Project-scoped storage folders
