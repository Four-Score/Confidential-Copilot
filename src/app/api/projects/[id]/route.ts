import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Helper to ensure project exists and belongs to user
async function verifyProjectAccess(supabase: any, projectId: string, userId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

// GET handler - Retrieve project details
export async function GET(
  req: NextRequest,
  context: any
): Promise<NextResponse> {
  try {
    const { id: projectId } = context.params;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, description, created_at, user_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error retrieving project:', error);
    return NextResponse.json({ error: 'Failed to retrieve project' }, { status: 500 });
  }
}

// PATCH handler - Update project information
export async function PATCH(
  req: NextRequest,
  context: any
): Promise<NextResponse> {
  try {
    const { id: projectId } = context.params;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const project = await verifyProjectAccess(supabase, projectId, user.id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    const body = await req.json();
    const { name, description } = body;

    const updateData: { name?: string; description?: string | null } = {};
    if (name !== undefined && name.trim() !== '') updateData.name = name;
    if (description !== undefined) updateData.description = description || null;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A project with this name already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
    }

    return NextResponse.json({ project: data });
  } catch (error) {
    console.error('Unexpected error in project update API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE handler - Delete a project
export async function DELETE(
  req: NextRequest,
  context: any
): Promise<NextResponse> {
  try {
    const { id: projectId } = context.params;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const project = await verifyProjectAccess(supabase, projectId, user.id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('Error deleting project:', error);
      return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in project deletion API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
