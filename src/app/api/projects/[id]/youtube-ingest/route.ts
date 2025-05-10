import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Helper to verify project access
async function verifyProjectAccess(supabase: any, userId: string, projectId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('id, user_id')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return { exists: false, error: error ? error.message : 'Project not found or access denied' };
  }
  return { exists: true };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // params is a Promise
): Promise<NextResponse> {
  try {
    const { id: projectId } = await params; // Await params before accessing its properties

    const supabase = await createClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify project access
    const { exists, error: accessError } = await verifyProjectAccess(supabase, user.id, projectId);
    if (!exists) {
      return NextResponse.json({ error: accessError }, { status: 403 });
    }

    // Parse request body
    const body = await req.json();
    const { videoId, transcript, title, url, chunks, metadata } = body;

    if (!videoId || !transcript || !chunks || !metadata) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert into v2_documents
    const { data: document, error: docError } = await supabase
      .from('v2_documents')
      .insert([{
        project_id: projectId,
        name: title || `YouTube Video ${videoId}`,
        type: 'youtube',
        file_size: transcript.length,
        content: transcript,
        metadata: {
          ...metadata,
          videoId,
          url,
          title,
        },
      }])
      .select('id')
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: docError?.message || 'Failed to save document' }, { status: 500 });
    }

    // Insert chunks into v2_vector_chunks
    const formattedChunks = chunks.map((chunk: any, idx: number) => ({
      document_id: document.id,
      chunk_number: idx + 1,
      chunk_content: chunk.content, // <-- FIXED: use chunk_content
      encrypted_embeddings: chunk.encrypted_embeddings,
      metadata: chunk.metadata || {},
    }));

    // console.log('First chunk:', formattedChunks[0]);

    const { error: chunkError } = await supabase
      .from('v2_vector_chunks')
      .insert(formattedChunks);

    if (chunkError) {
      console.error('Chunk insert error:', chunkError, formattedChunks);
      return NextResponse.json({ error: chunkError.message || 'Failed to save chunks' }, { status: 500 });
    }

    return NextResponse.json({ youtubeId: document.id, success: true });
  } catch (error: any) {
    console.error('Error in YouTube ingest route:', error);
    return NextResponse.json(
      { error: 'Failed to ingest YouTube data' },
      { status: 500 }
    );
  }
}