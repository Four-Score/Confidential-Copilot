import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// Type for the request body
interface DocumentUploadBody {
  name: string;                     // Deterministically encrypted document name
  originalName: string;             // Original file name (for reference, encrypted)
  type: 'pdf' | 'link' | 'video';   // Document type
  fileSize: number;                 // Original file size in bytes
  pageCount: number;                // Number of pages (for PDFs)
  encryptedContent: string;         // Standard encrypted document content
  encryptedMetadata: any;           // Deterministically encrypted metadata
  chunks: {
    chunkNumber: number;
    encryptedContent: string;       // Standard encrypted chunk content
    encryptedEmbeddings: number[];  // Vector-encrypted embeddings
    metadata: any;                  // Deterministic encrypted chunk metadata
  }[];
}

/**
 * Handles document upload for a specific project
 * POST: Creates a new document with its vector chunks
 */
export async function POST(
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
    
    // Verify project access and ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId) // Use the projectId variable (which now holds params.id)
      .eq('user_id', session.user.id)
      .single();
      
    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }
    
    // Parse request body
    const body = await req.json() as DocumentUploadBody;
    
    // Start a transaction to ensure atomic operations
    // Note: Ideally we would use a transaction, but we'll use sequential operations for now
    
    // 1. Insert the document
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .insert({
        project_id: projectId,
        name: body.name,
        type: body.type,
        encrypted_content: body.encryptedContent,
        encrypted_metadata: body.encryptedMetadata,
        file_size: body.fileSize,
        page_count: body.pageCount
      })
      .select()
      .single();
      
    if (documentError) {
      console.error('Error creating document:', documentError);
      return NextResponse.json(
        { error: 'Failed to create document' },
        { status: 500 }
      );
    }
    
    // 2. Insert vector chunks
    const chunksToInsert = body.chunks.map(chunk => ({
      document_id: document.id,
      chunk_number: chunk.chunkNumber,
      encrypted_chunk_content: chunk.encryptedContent,
      encrypted_embeddings: chunk.encryptedEmbeddings,
      metadata: chunk.metadata
    }));
    
    const { error: chunksError } = await supabase
      .from('vector_chunks')
      .insert(chunksToInsert);
      
    if (chunksError) {
      console.error('Error creating vector chunks:', chunksError);
      
      // Attempt to clean up the document if chunks insert fails
      await supabase
        .from('documents')
        .delete()
        .eq('id', document.id);
        
      return NextResponse.json(
        { error: 'Failed to store document chunks' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      documentId: document.id,
      chunkCount: body.chunks.length
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to process document upload' },
      { status: 500 }
    );
  }
}

/**
 * Lists all documents for a specific project
 * GET: Returns documents with optional metadata
 */
export async function GET(
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
    
    // Verify project access and ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .eq('user_id', session.user.id)
      .single();
      
    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }
    
    // Fetch documents for this project
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('id, name, type, upload_date, file_size, page_count')
      .eq('project_id', projectId)
      .order('upload_date', { ascending: false });
      
    if (documentsError) {
      console.error('Error fetching documents:', documentsError);
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ documents });
    
  } catch (error) {
    console.error('Error listing documents:', error);
    return NextResponse.json(
      { error: 'Failed to list documents' },
      { status: 500 }
    );
  }
}