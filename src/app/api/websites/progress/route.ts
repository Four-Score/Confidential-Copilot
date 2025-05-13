import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  context: any
): Promise<NextResponse> {
  try {
    const jobId = context.params.jobId;

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
    const response = await fetch(
      `${req.nextUrl.origin}/api/documents/progress?uploadId=${jobId}`,
      {
        headers: {
          Cookie: req.headers.get('cookie') || '',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to get website processing status' },
        { status: 500 }
      );
    }

    const statusData = await response.json();
    return NextResponse.json(statusData);
  } catch (error) {
    console.error('Error in website status endpoint:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
