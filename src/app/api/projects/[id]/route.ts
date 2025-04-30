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
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const projectId = params.id;
    
    // Initialize Supabase client with cookies
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify project access
    const project = await verifyProjectAccess(supabase, projectId, session.user.id);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ project });
    
  } catch (error) {
    console.error('Unexpected error in project details API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH handler - Update project information
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const projectId = params.id;
    
    // Initialize Supabase client with cookies
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify project access
    const project = await verifyProjectAccess(supabase, projectId, session.user.id);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    const { name, description } = body;
    
    // Prepare update object
    const updateData: { name?: string; description?: string | null } = {};
    
    if (name !== undefined && name.trim() !== '') {
      updateData.name = name;
    }
    
    if (description !== undefined) {
      updateData.description = description || null;
    }
    
    // If no valid fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }
    
    // Update the project
    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating project:', error);
      
      // Check for unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A project with this name already exists' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to update project' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ project: data });
    
  } catch (error) {
    console.error('Unexpected error in project update API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE handler - Delete a project
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const projectId = params.id;
    
    // Initialize Supabase client with cookies
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify project access
    const project = await verifyProjectAccess(supabase, projectId, session.user.id);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }
    
    // Delete the project (cascading deletion handles related documents and vector chunks)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);
      
    if (error) {
      console.error('Error deleting project:', error);
      return NextResponse.json(
        { error: 'Failed to delete project' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Unexpected error in project deletion API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}