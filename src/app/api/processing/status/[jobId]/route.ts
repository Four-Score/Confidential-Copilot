import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET endpoint to check the status of a document processing job
 */
export async function GET(
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
    
    // Make an internal request to the progress endpoint
    // Note: In a production app, you would use a proper job queue system 
    // or database for tracking job status
    const response = await fetch(`${req.nextUrl.origin}/api/documents/progress?uploadId=${jobId}`, {
      headers: {
        cookie: req.headers.get('cookie') || ''
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to retrieve job status' },
        { status: response.status }
      );
    }
    
    const statusData = await response.json();
    return NextResponse.json(statusData);
    
  } catch (error) {
    console.error('Error checking job status:', error);
    return NextResponse.json(
      { error: 'Failed to check job status' },
      { status: 500 }
    );
  }
}