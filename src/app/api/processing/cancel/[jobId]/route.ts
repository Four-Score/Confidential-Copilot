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
    const jobId = params.jobId;
    
    // Initialize Supabase client
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // In a production system, we'd update a jobs table
    // For this MVP, we'll reuse the progress tracking endpoint
    
    // Update the progress with a cancelled status
    const response = await fetch(
      `${req.nextUrl.origin}/api/documents/progress`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': req.headers.get('cookie') || ''
        },
        body: JSON.stringify({
          uploadId: jobId,
          progress: 0,
          status: 'cancelled',
          error: 'Operation cancelled by user'
        })
      }
    );
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to cancel job' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Processing job cancelled successfully'
    });
    
  } catch (error) {
    console.error('Error cancelling processing job:', error);
    return NextResponse.json(
      { error: 'Failed to cancel processing job' },
      { status: 500 }
    );
  }
}