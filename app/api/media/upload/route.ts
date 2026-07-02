// Cloudinary upload signature endpoint (Feature 54).
// Generates secure signatures for client-side uploads to Cloudinary.

import { NextRequest, NextResponse } from 'next/server';
import { generateUploadSignature } from '@/lib/cloudinary/upload';
import { getAuthUser } from '@/lib/auth/get-auth-user';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    // Generate upload signature
    const uploadParams = await generateUploadSignature(projectId);

    return NextResponse.json(uploadParams);
  } catch (error) {
    console.error('Upload signature generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload signature' },
      { status: 500 }
    );
  }
}
