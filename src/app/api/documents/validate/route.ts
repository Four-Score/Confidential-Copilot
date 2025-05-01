import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { MAX_FILE_SIZE } from '@/lib/pdfUtils';

/**
 * Validates a file before upload.
 * This endpoint checks basic requirements without processing the actual content.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Initialize Supabase client with cookies
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse request as FormData
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    // Basic validation
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Check file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are currently supported' },
        { status: 400 }
      );
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          error: `File size exceeds the maximum allowed size (${MAX_FILE_SIZE / (1024 * 1024)}MB)` 
        },
        { status: 400 }
      );
    }
    
    // Return success with file metadata
    return NextResponse.json({
      valid: true,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
    
  } catch (error) {
    console.error('Error validating document:', error);
    return NextResponse.json(
      { error: 'Failed to validate document' },
      { status: 500 }
    );
  }
}