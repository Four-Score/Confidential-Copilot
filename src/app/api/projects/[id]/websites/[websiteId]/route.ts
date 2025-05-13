import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Helper function to verify project and website access
 */
async function verifyAccess(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  websiteId: string
) {
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();

  if (projectError || !project) {
    return {
      allowed: false,
      error: projectError?.message || 'Project not found or access denied'
    };
  }

  const { data: website, error: websiteError } = await supabase
    .from('v2_documents')
    .select('id')
    .eq('id', websiteId)
    .eq('project_id', projectId)
    .single();

  if (websiteError || !website) {
    return {
      allowed: false,
      error: websiteError?.message || 'Website not found or does not belong to this project'
    };
  }

  return { allowed: true };
}

/**
 * GET endpoint for retrieving specific website details
 */
export async function GET(
  request: NextRequest,
  context: any
): Promise<NextResponse> {
  try {
    const { id: projectId, websiteId } = context.params;

    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { allowed, error: accessError } = await verifyAccess(supabase, user.id, projectId, websiteId);
    if (!allowed) {
      return NextResponse.json({ error: accessError }, { status: 403 });
    }

    const { data: website, error: websiteError } = await supabase
      .from('v2_documents')
      .select('id, name, type, upload_date, file_size, content, metadata')
      .eq('id', websiteId)
      .single();

    if (websiteError) {
      console.error('Error fetching website:', websiteError);
      return NextResponse.json({ error: 'Failed to fetch website details' }, { status: 500 });
    }

    const { count: chunkCount, error: countError } = await supabase
      .from('v2_vector_chunks')
      .select('id', { count: 'exact', head: true })
      .eq('document_id', websiteId);

    if (countError) {
      console.error('Error counting chunks:', countError);
    }

    const websiteDetails = {
      id: website.id,
      name: website.name,
      type: website.type,
      upload_date: website.upload_date,
      file_size: website.file_size,
      url: website.metadata?.url || '',
      title: website.metadata?.title || website.name,
      description: website.metadata?.description || '',
      content: website.content || '',
      metadata: website.metadata || {},
      chunk_count: chunkCount || 0
    };

    return NextResponse.json(websiteDetails);

  } catch (error) {
    console.error('Error in website details endpoint:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * DELETE endpoint for removing a website
 */
export async function DELETE(
  request: NextRequest,
  context: any
): Promise<NextResponse> {
  try {
    const { id: projectId, websiteId } = context.params;

    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { allowed, error: accessError } = await verifyAccess(supabase, user.id, projectId, websiteId);
    if (!allowed) {
      return NextResponse.json({ error: accessError }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from('v2_documents')
      .delete()
      .eq('id', websiteId);

    if (deleteError) {
      console.error('Error deleting website:', deleteError);
      return NextResponse.json({ error: 'Failed to delete website' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Website deleted successfully'
    });

  } catch (error) {
    console.error('Error in website deletion endpoint:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
