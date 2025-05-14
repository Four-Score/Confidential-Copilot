import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  req: NextRequest,
  context: any
): Promise<NextResponse> {
  try {
    const { id: projectId, youtubeId } = context.params;
    const supabase = await createClient();

    // (Optional) Authenticate user and check project ownership here

    const { error } = await supabase
      .from('v2_documents')
      .delete()
      .eq('id', youtubeId)
      .eq('project_id', projectId)
      .eq('type', 'youtube');

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json({ error: 'Failed to delete YouTube document' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Unexpected error in DELETE handler:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request, context: any) {
  try {
    const { id: projectId, youtubeId } = context.params;
    const supabase = await createClient();

    // Fetch the YouTube document by ID and project
    const { data, error } = await supabase
      .from('v2_documents')
      .select('*')
      .eq('id', youtubeId)
      .eq('project_id', projectId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'YouTube document not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch YouTube document' }, { status: 500 });
  }
}
