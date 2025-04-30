import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// GET handler - List all projects for the authenticated user
export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
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
    
    // Query projects for the current user
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ projects: data });
    
  } catch (error) {
    console.error('Unexpected error in projects API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST handler - Create a new project
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
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
    
    // Parse request body
    const body = await req.json();
    const { name, description } = body;
    
    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }
    
    // Create the new project
    const { data, error } = await supabase
      .from('projects')
      .insert([
        { 
          name, 
          description: description || null,
          user_id: session.user.id
        }
      ])
      .select()
      .single();
      
    if (error) {
      console.error('Error creating project:', error);
      
      // Check for unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A project with this name already exists' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ project: data }, { status: 201 });
    
  } catch (error) {
    console.error('Unexpected error in projects API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}