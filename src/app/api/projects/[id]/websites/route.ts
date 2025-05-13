import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateWebsiteUrl } from '@/lib/websiteUtils';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Helper function to verify project access for a user
 */
async function verifyProjectAccess(supabase: SupabaseClient, userId: string, projectId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('id, user_id')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return {
      exists: false,
      error: error ? error.message : 'Project not found or access denied'
    };
  }

  return { exists: true };
}

/**
 * POST endpoint for submitting a website URL for extraction and storage
 */
export async function POST(
  request: NextRequest,
  context: any
): Promise<NextResponse> {
  try {
    const projectId = context.params.id;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { exists, error: accessError } = await verifyProjectAccess(supabase, user.id, projectId);
    if (!exists) {
      return NextResponse.json({ error: accessError }, { status: 403 });
    }

    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const validationResult = await validateWebsiteUrl(url);
    if (!validationResult.isValid) {
      return NextResponse.json({ error: validationResult.message || 'Invalid URL' }, { status: 400 });
    }

    const jobId = crypto.randomUUID();

    return NextResponse.json({
      jobId,
      url,
      message: 'Website extraction job started',
      status: 'processing'
    });
  } catch (error) {
    console.error('Error processing website submission:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * GET endpoint for listing websites in a project
 */
export async function GET(
  request: NextRequest,
  context: any
): Promise<NextResponse> {
  try {
    const projectId = context.params.id;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { exists, error: accessError } = await verifyProjectAccess(supabase, user.id, projectId);
    if (!exists) {
      return NextResponse.json({ error: accessError }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const sortBy = searchParams.get('sortBy') || 'upload_date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const search = searchParams.get('search') || '';

    let query = supabase
      .from('v2_documents')
      .select('id, name, type, upload_date, file_size, metadata')
      .eq('project_id', projectId)
      .eq('type', 'website');

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (sortBy && ['name', 'upload_date', 'file_size'].includes(sortBy)) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }

    const { data: websites, error } = await query;

    if (error) {
      console.error('Error fetching websites:', error);
      return NextResponse.json({ error: 'Failed to fetch websites' }, { status: 500 });
    }

    const formattedWebsites = websites.map(website => ({
      id: website.id,
      name: website.name,
      type: website.type,
      upload_date: website.upload_date,
      file_size: website.file_size,
      url: website.metadata?.url || '',
      title: website.metadata?.title || website.name,
      description: website.metadata?.description || '',
      favicon: website.metadata?.favicon || '',
      metadata: website.metadata || {}
    }));

    return NextResponse.json({ websites: formattedWebsites });
  } catch (error) {
    console.error('Error fetching websites:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
