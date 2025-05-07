import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; youtubeId: string } } | { params: Promise<{ id: string; youtubeId: string }> }
): Promise<NextResponse> {
  const { id: projectId, youtubeId } = await params; // ✅ Await params!
  const supabase = await createClient();

  // (Optional) Authenticate user and check project ownership here

  // Delete the YouTube document from v2_documents
  const { error } = await supabase
    .from('v2_documents')
    .delete()
    .eq('id', youtubeId)
    .eq('project_id', projectId)
    .eq('type', 'youtube');

  if (error) {
    return NextResponse.json({ error: 'Failed to delete YouTube document' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}