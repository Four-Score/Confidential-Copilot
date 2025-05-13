import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  context: any
): Promise<NextResponse> {
  try {
    const { id: projectId } = context.params;
    const supabase = await createClient();

    // TODO: Add authentication and project ownership checks here

    const { data: youtubeDocs, error } = await supabase
      .from('v2_documents')
      .select('id, name, type, upload_date, file_size, content, metadata')
      .eq('project_id', projectId)
      .eq('type', 'youtube')
      .order('upload_date', { ascending: false });

    if (error) {
      console.error('Error fetching YouTube documents:', error);
      return NextResponse.json({ error: 'Failed to fetch YouTube documents' }, { status: 500 });
    }

    return NextResponse.json({ youtube: youtubeDocs });
  } catch (error: any) {
    console.error('Unexpected error in GET handler:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
