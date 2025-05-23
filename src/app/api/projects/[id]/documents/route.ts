import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// Type for the request body
interface DocumentUploadBody {
  name: string;
  originalName: string;
  type: 'pdf' | 'link' | 'video';
  fileSize: number;
  pageCount: number;
  encryptedContent: string;
  encryptedMetadata: any;
  chunks: {
    chunkNumber: number;
    encryptedContent: string;
    encryptedEmbeddings: number[];
    metadata: any;
  }[];
}

/**
 * Retries a database operation with exponential backoff
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
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }

  throw lastError!;
}

// GET handler - Retrieve all documents for a specific project
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
      .select('user_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('id, name, type, upload_date, file_size, page_count')
      .eq('project_id', projectId)
      .order('upload_date', { ascending: false });

    if (documentsError) {
      console.error('Error fetching documents:', documentsError);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error in documents endpoint:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST handler - Add a new document to a project
export async function POST(
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
      .select('user_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body: DocumentUploadBody = await req.json();
    const {
      name,
      originalName,
      type,
      encryptedContent,
      encryptedMetadata,
      fileSize,
      pageCount,
      chunks,
    } = body;

    if (!name || !type || !encryptedContent || !chunks) {
      return NextResponse.json({ error: 'Missing required document fields' }, { status: 400 });
    }

    try {
      const { data, error } = await supabase.rpc('insert_document_with_chunks', {
        p_project_id: projectId,
        p_name: name,
        p_original_name: originalName || name,
        p_type: type,
        p_file_size: fileSize,
        p_page_count: pageCount || 1,
        p_encrypted_content: encryptedContent,
        p_encrypted_metadata: encryptedMetadata || {},
        p_chunks: chunks,
      });

      if (error) {
        console.error('Error inserting document with chunks:', error);
        return NextResponse.json({ error: 'Failed to save document and chunks' }, { status: 500 });
      }

      return NextResponse.json({
        documentId: data.id,
        success: true,
      });
    } catch (dbError) {
      console.error('Database transaction failed:', dbError);
      return NextResponse.json({ error: 'Database transaction failed' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in document upload endpoint:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
