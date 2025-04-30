import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

/**
 * Handles document-specific operations
 * GET: Retrieves document details and metadata
 * DELETE: Removes a document and its associated chunks
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const documentId = params.id;
    
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
    
    // Verify document access and ownership (through project)
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
        project_id,
        projects!inner (
          id,
          name,
          user_id
        )
      `)
      .eq('id', documentId)
      .single();
      
    if (documentError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    // Verify document ownership
    if (!Array.isArray(document.projects) || document.projects[0]?.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
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
      projectName: document.projects[0]?.name,
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
 * Deletes a document and its associated chunks
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const documentId = params.id;
    
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
    
    // Verify document access and ownership (through project)
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select(`
        id,
        projects!inner (
          user_id
        )
      `)
      .eq('id', documentId)
      .single();
      
    if (documentError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    // Verify document ownership
    if (!Array.isArray(document.projects) || document.projects[0]?.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
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