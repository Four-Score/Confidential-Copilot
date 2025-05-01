import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * API endpoint to cancel a document processing job.
 * This allows users to stop long-running operations.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { jobId: string } }
): Promise<NextResponse> {
  try {
    const { jobId } = params;
    
    // Initialize Supabase client
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Make an internal request to update the job status
    const response = await fetch(`${req.nextUrl.origin}/api/documents/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: req.headers.get('cookie') || ''
      },
      body: JSON.stringify({
        uploadId: jobId,
        status: 'cancelled',
        progress: 0
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to cancel job' },
        { status: response.status }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Job cancelled successfully'
    });
    
  } catch (error) {
    console.error('Error cancelling job:', error);
    return NextResponse.json(
      { error: 'Failed to cancel job' },
      { status: 500 }
    );
  }
}