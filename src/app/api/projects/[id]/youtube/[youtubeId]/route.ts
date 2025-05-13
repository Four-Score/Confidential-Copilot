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
