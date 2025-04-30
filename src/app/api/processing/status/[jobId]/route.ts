import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * API endpoint to check the status of a document processing job.
 * This leverages the existing progress tracking system.
 */
export async function GET(
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
    
    // In a production system, we'd query a jobs table
    // For this MVP, we'll reuse the progress tracking endpoint
    
    // Make an internal request to the progress endpoint
    const response = await fetch(
      `${req.nextUrl.origin}/api/documents/progress?uploadId=${jobId}`,
      {
        headers: {
          'Cookie': req.headers.get('cookie') || ''
        }
      }
    );
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Job status not found' },
        { status: 404 }
      );
    }
    
    const statusData = await response.json();
    
    return NextResponse.json(statusData);
    
  } catch (error) {
    console.error('Error checking processing status:', error);
    return NextResponse.json(
      { error: 'Failed to check processing status' },
      { status: 500 }
    );
  }
}