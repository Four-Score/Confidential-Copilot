import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Handles document-specific operations within a project context
 * GET: Retrieves document details and metadata
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string, documentId: string } }
): Promise<NextResponse> {
  try {
    const { id: projectId, documentId } = await params;
    
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
    
    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single();
      
    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    if (project.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    // Get document details and verify it belongs to the project
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select(`
        id, 
        name, 
        type, 
        upload_date, 
        encrypted_metadata, 
        file_size, 
        page_count,
        project_id
      `)
      .eq('id', documentId)
      .eq('project_id', projectId)
      .single();
      
    if (documentError || !document) {
      return NextResponse.json(
        { error: 'Document not found or does not belong to this project' },
        { status: 404 }
      );
    }
    
    // Count the number of chunks
    const { count: chunkCount, error: countError } = await supabase
      .from('vector_chunks')
      .select('id', { count: 'exact', head: true })
      .eq('document_id', documentId);
      
    if (countError) {
      console.error('Error counting chunks:', countError);
      // Continue despite the error, just don't include chunk count
    }
    
    // Return document metadata (but not the full content for efficiency)
    return NextResponse.json({
      id: document.id,
      name: document.name,
      type: document.type,
      uploadDate: document.upload_date,
      encryptedMetadata: document.encrypted_metadata,
      fileSize: document.file_size,
      pageCount: document.page_count,
      projectId: document.project_id,
      chunkCount: chunkCount || 0
    });
    
  } catch (error) {
    console.error('Error fetching document metadata:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document metadata' },
      { status: 500 }
    );
  }
}

/**
 * Deletes a document within a project context
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string, documentId: string } }
): Promise<NextResponse> {
  try {
    const { id: projectId, documentId } = await params;
    
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
    
    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single();
      
    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    if (project.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    // Verify document exists and belongs to the project
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('id, project_id')
      .eq('id', documentId)
      .eq('project_id', projectId)
      .single();
      
    if (documentError || !document) {
      return NextResponse.json(
        { error: 'Document not found or does not belong to this project' },
        { status: 404 }
      );
    }
    
    // Delete the document (chunks will be deleted via CASCADE)
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);
      
    if (deleteError) {
      console.error('Error deleting document:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}