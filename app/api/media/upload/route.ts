// Cloudinary upload signature endpoint (Feature 54).
// Generates secure signatures for client-side uploads to Cloudinary.

import { NextRequest, NextResponse } from 'next/server';
import { generateUploadSignature } from '@/lib/cloudinary/upload';
import { requireAuth, AuthError } from '@/lib/auth/require-auth';
import { requireProjectMember, ProjectAuthError } from '@/lib/auth/project-access';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth();
    
    const body = await request.json();
    const { projectId, mimeType } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    if (mimeType !== undefined && typeof mimeType !== 'string') {
      return NextResponse.json({ error: 'mimeType must be a string' }, { status: 400 });
    }

    // Verify project membership
    await requireProjectMember(projectId, user.id);

    // Generate upload signature with optional mimeType for folder organization
    const uploadParams = await generateUploadSignature(projectId, mimeType);

    return NextResponse.json(uploadParams);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof ProjectAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Upload signature generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload signature' },
      { status: 500 }
    );
  }
}
