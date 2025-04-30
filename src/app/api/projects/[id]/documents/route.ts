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
 * Retries a database operation with exponential backoff
 * @param operation Function to retry
 * @param maxRetries Maximum number of retries
 * @param initialDelay Initial delay in milliseconds
 */
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 300
): Promise<T> {
  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Check if we should retry based on error type
      // Common transient errors: connection issues, deadlocks, etc.
      const isTransientError = 
        error instanceof Error && 
        (error.message.includes('timeout') || 
         error.message.includes('connection') ||
         error.message.includes('deadlock') ||
         error.message.toLowerCase().includes('temporarily unavailable'));
      
      if (!isTransientError || attempt === maxRetries) {
        throw error;
      }
      
      console.warn(`Operation failed, retrying (${attempt + 1}/${maxRetries})...`, error);
      
      // Wait with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
  
  throw lastError!;
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
    
    // Initialize Supabase client
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify that the project exists and belongs to the user
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', session.user.id)
      .single();
      
    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    
    // Start a transaction using Supabase's built-in transaction support
    const { data: documentData, error: transactionError } = await supabase.rpc(
      'insert_document_with_chunks',
      {
        p_project_id: projectId,
        p_name: body.name,
        p_original_name: body.originalName,
        p_type: body.type,
        p_file_size: body.fileSize,
        p_page_count: body.pageCount,
        p_encrypted_content: body.encryptedContent,
        p_encrypted_metadata: body.encryptedMetadata,
        p_chunks: body.chunks
      }
    );
    
    if (transactionError) {
      console.error('Transaction error:', transactionError);
      return NextResponse.json(
        { error: 'Failed to store document' },
        { status: 500 }
      );
    }
    
    // Return the document ID
    return NextResponse.json({
      documentId: documentData.id,
      message: 'Document uploaded successfully'
    });
    
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
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
    const { id: projectId } = await params;
    
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