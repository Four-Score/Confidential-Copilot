import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } } | { params: Promise<{ id: string }> }
  ): Promise<NextResponse> {
    const { id: projectId } = await params; // ✅ Await params!
    const supabase = await createClient();

  // (Add authentication and project ownership checks as in your website route)

  const { data: youtubeDocs, error } = await supabase
    .from('v2_documents')
    .select('id, name, type, upload_date, file_size, content, metadata')
    .eq('project_id', projectId)
    .eq('type', 'youtube')
    .order('upload_date', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch YouTube documents' }, { status: 500 });
  }

  return NextResponse.json({ youtube: youtubeDocs });
}