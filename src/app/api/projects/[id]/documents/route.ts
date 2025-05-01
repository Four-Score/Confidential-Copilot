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

// GET handler - Retrieve all documents for a specific project
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id: projectId } = await params;
    
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
      .select('user_id')
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
    
    // Fetch all documents for this project
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
    
    return NextResponse.json(documents);
    
  } catch (error) {
    console.error('Error in documents endpoint:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

// POST handler - Add a new document to a project
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id: projectId } = await params;
    
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
      .select('user_id')
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
    
    // Process the document upload
    // This would typically involve handling file upload, processing content,
    // encrypting data, and storing metadata
    const body = await req.json();
    const { name, type, encryptedContent, encryptedMetadata, fileSize, pageCount } = body;
    
    if (!name || !type || !encryptedContent) {
      return NextResponse.json(
        { error: 'Missing required document fields' },
        { status: 400 }
      );
    }
    
    // Insert the new document
    const { data: document, error: insertError } = await supabase
      .from('documents')
      .insert([
        {
          name,
          type,
          encrypted_content: encryptedContent,
          encrypted_metadata: encryptedMetadata || null,
          file_size: fileSize,
          page_count: pageCount,
          project_id: projectId,
          upload_date: new Date().toISOString()
        }
      ])
      .select()
      .single();
      
    if (insertError) {
      console.error('Error inserting document:', insertError);
      return NextResponse.json(
        { error: 'Failed to save document' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(document);
    
  } catch (error) {
    console.error('Error in document upload endpoint:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}