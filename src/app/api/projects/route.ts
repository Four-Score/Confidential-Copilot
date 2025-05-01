import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET endpoint to retrieve all projects for the authenticated user
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Initialize Supabase client
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Retrieve projects for the authenticated user
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, description, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(projects);
    
  } catch (error) {
    console.error('Error in projects endpoint:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to create a new project for the authenticated user
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const body = await req.json();
    const { name, description } = body;
    
    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if a project with the same name already exists for this user
    const { data: existingProject, error: checkError } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', name)
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking existing project:', checkError);
    } else if (existingProject) {
      return NextResponse.json(
        { error: 'A project with this name already exists' },
        { status: 409 }  // Conflict status code
      );
    }
    
    // Create the new project
    const { data: project, error: creationError } = await supabase
      .from('projects')
      .insert([
        {
          name,
          description: description || '',
          user_id: user.id
        }
      ])
      .select()
      .single();
    
    if (creationError) {
      console.error('Error creating project:', creationError);
      // Check for specific error cases
      if (creationError.code === '23505') {
        return NextResponse.json(
          { error: 'A project with this name already exists' },
          { status: 409 }  // Conflict status code
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(project);
    
  } catch (error) {
    console.error('Error in create project endpoint:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}